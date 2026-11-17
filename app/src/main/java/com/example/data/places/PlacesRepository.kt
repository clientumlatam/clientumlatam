package com.example.data.places

import android.content.Context
import com.example.data.local.BusinessDao
import com.example.data.local.OsmCacheEntity
import com.example.domain.model.BusinessCategory
import com.example.domain.model.BusinessSource
import com.example.domain.model.BusinessStatus
import com.example.domain.model.DirectoryBusiness
import com.example.domain.model.DirectoryCategories
import com.example.domain.model.GeoPointCoord
import com.example.domain.model.LocalityRegion
import com.example.domain.model.OsmBoundingBox
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.Calendar
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject

/** A Photon/Overpass autocomplete suggestion. */
data class PlaceAutocompleteSuggestion(
  val placeId: String,
  val primaryText: String,
  val secondaryText: String = "",
  val business: DirectoryBusiness? = null,
)

class PlacesRepository(
  private val context: Context,
  private val businessDao: BusinessDao? = null,
  private val clockMs: () -> Long = System::currentTimeMillis,
) {
  private val appContext = context.applicationContext
  private val client = OkHttpClient()

  suspend fun searchBusinesses(
    query: String,
    locality: LocalityRegion,
    category: BusinessCategory,
    openNowOnly: Boolean = false,
    deliveryHint: Boolean = false,
    searchCenterOverride: GeoPointCoord? = null,
  ): Result<List<DirectoryBusiness>> = withContext(Dispatchers.IO) {
    runCatching {
      val referenceCenter = searchCenterOverride ?: locality.latLng
      val cacheKey = buildCacheKey(referenceCenter, category, deliveryHint)

      if (businessDao != null) {
        val cached = businessDao.getCachedSearch(cacheKey)
        if (cached != null && clockMs() - cached.cachedAtMillis <= CACHE_TTL_MS) {
          val cachedBusinesses = parseSerializedBusinesses(cached.payloadJson)
          return@runCatching filterBusinesses(
            cachedBusinesses,
            query,
            openNowOnly,
            deliveryHint,
          )
        }
      }

      val bbox = locality.boundingBox(searchCenterOverride)
      val overpassQuery = buildOverpassBboxQuery(query, bbox, category, deliveryHint)
      val request = Request.Builder()
        .url("https://overpass-api.de/api/interpreter")
        .header("User-Agent", USER_AGENT)
        .post(
          okhttp3.RequestBody.create(
            okhttp3.MediaType.parse("application/x-www-form-urlencoded"),
            "data=" + URLEncoder.encode(overpassQuery, StandardCharsets.UTF_8.name()),
          )
        )
        .build()

      client.newCall(request).execute().use { response ->
        if (!response.isSuccessful) throw IllegalStateException("Overpass respondió ${response.code()}")
        val body = response.body()?.string().orEmpty()
        val elements = JSONObject(body).optJSONArray("elements") ?: JSONArray()
        val businesses = parseOverpassElements(elements, locality, category, referenceCenter)

        if (businessDao != null) {
          businessDao.upsertCachedSearch(
            OsmCacheEntity(cacheKey, serializeBusinesses(businesses), clockMs())
          )
        }

        filterBusinesses(businesses, query, openNowOnly, deliveryHint)
      }
    }
  }

  suspend fun autocompletePlaces(
    query: String,
    locality: LocalityRegion,
  ): Result<List<PlaceAutocompleteSuggestion>> = withContext(Dispatchers.IO) {
    runCatching {
      if (query.trim().length < 2) return@runCatching emptyList()

      val url = "https://photon.komoot.io/api/"
        .toHttpUrl()
        .newBuilder()
        .addQueryParameter("q", query.trim())
        .addQueryParameter("lat", locality.latitude.toString())
        .addQueryParameter("lon", locality.longitude.toString())
        .addQueryParameter("limit", "8")
        .build()

      val request = Request.Builder()
        .url(url)
        .header("User-Agent", USER_AGENT)
        .build()

      client.newCall(request).execute().use { response ->
        if (!response.isSuccessful) throw IllegalStateException("Photon respondió ${response.code()}")
        parsePhotonFeatures(response.body()?.string().orEmpty(), locality)
      }
    }
  }

  private fun filterBusinesses(
    businesses: List<DirectoryBusiness>,
    query: String,
    openNowOnly: Boolean,
    deliveryHint: Boolean,
  ): List<DirectoryBusiness> {
    val trimmed = query.trim().lowercase(Locale("es", "AR"))
    return businesses.filter { business ->
      val matchesQuery = trimmed.isEmpty() ||
        business.name.lowercase(Locale("es", "AR")).contains(trimmed) ||
        business.categoryName.lowercase(Locale("es", "AR")).contains(trimmed) ||
        business.address.lowercase(Locale("es", "AR")).contains(trimmed)
      val matchesOpen = !openNowOnly || business.isOpenNow == true
      val matchesDelivery = !deliveryHint || business.hasDelivery
      matchesQuery && matchesOpen && matchesDelivery
    }
  }

  companion object {
    const val USER_AGENT = "GuiaGenioAndroid/1.0 (OpenStreetMap directory)"
    const val CACHE_TTL_MS = 24L * 60L * 60L * 1000L

    private fun buildCacheKey(
      center: GeoPointCoord,
      category: BusinessCategory,
      deliveryHint: Boolean,
    ): String {
      val lat = String.format(Locale.US, "%.3f", center.latitude)
      val lon = String.format(Locale.US, "%.3f", center.longitude)
      return "${lat}_${lon}_${category.id}_${deliveryHint}"
    }

    fun serializeBusinesses(businesses: List<DirectoryBusiness>): String {
      val array = JSONArray()
      businesses.forEach { business ->
        array.put(
          JSONObject().apply {
            put("id", business.id)
            put("name", business.name)
            put("categoryId", business.categoryId)
            put("categoryName", business.categoryName)
            put("localityName", business.localityName)
            put("address", business.address)
            put("latitude", business.latitude)
            put("longitude", business.longitude)
            put("phoneNumber", business.phoneNumber ?: JSONObject.NULL)
            put("whatsappNumber", business.whatsappNumber ?: JSONObject.NULL)
            put("websiteUri", business.websiteUri ?: JSONObject.NULL)
            put("description", business.description ?: JSONObject.NULL)
            put("isOpenNow", business.isOpenNow ?: JSONObject.NULL)
            put("openingHoursRaw", business.openingHoursRaw ?: JSONObject.NULL)
            put("hasDelivery", business.hasDelivery)
            put("source", business.source.name)
            put("status", business.status.name)
            put("distanceMeters", business.distanceMeters ?: JSONObject.NULL)
            put("markerColorArgb", business.markerColorArgb)
          }
        )
      }
      return array.toString()
    }

    fun parseSerializedBusinesses(raw: String): List<DirectoryBusiness> {
      if (raw.isBlank()) return emptyList()
      return try {
        val array = JSONArray(raw)
        buildList {
          for (i in 0 until array.length()) {
            val json = array.getJSONObject(i)
            val source = try { BusinessSource.valueOf(json.optString("source", "OPENSTREETMAP")) } catch (_: Exception) { BusinessSource.OPENSTREETMAP }
            val status = try { BusinessStatus.valueOf(json.optString("status", "APPROVED")) } catch (_: Exception) { BusinessStatus.APPROVED }
            val nullableString = { key: String -> json.opt(key)?.takeUnless { it == JSONObject.NULL }?.toString() }
            val nullableDouble = json.opt("distanceMeters")?.takeUnless { it == JSONObject.NULL }?.toString()?.toFloatOrNull()
            val nullableBoolean = json.opt("isOpenNow")?.takeUnless { it == JSONObject.NULL }?.toString()?.toBooleanStrictOrNull()
            add(
              DirectoryBusiness(
                id = json.optString("id"),
                name = json.optString("name"),
                categoryId = json.optString("categoryId"),
                categoryName = json.optString("categoryName"),
                localityName = json.optString("localityName"),
                address = json.optString("address"),
                latitude = json.optDouble("latitude"),
                longitude = json.optDouble("longitude"),
                phoneNumber = nullableString("phoneNumber"),
                whatsappNumber = nullableString("whatsappNumber"),
                websiteUri = nullableString("websiteUri"),
                description = nullableString("description"),
                isOpenNow = nullableBoolean,
                openingHoursRaw = nullableString("openingHoursRaw"),
                hasDelivery = json.optBoolean("hasDelivery"),
                source = source,
                status = status,
                distanceMeters = nullableDouble,
                markerColorArgb = json.optInt("markerColorArgb", 0xFF1546A6.toInt()),
              )
            )
          }
        }
      } catch (_: Exception) {
        emptyList()
      }
    }

    fun buildOverpassBboxQuery(
      query: String,
      bbox: OsmBoundingBox,
      category: BusinessCategory,
      deliveryHint: Boolean,
    ): String {
      val clauses = buildString {
        if (category.osmFilterClauses.isNotEmpty()) {
          category.osmFilterClauses.forEach { clause ->
            append("nwr$clause(${bbox.toOverpassBbox()});")
            append("nwr$clause(${bbox.toOverpassBbox()});")
          }
        } else {
          append("nwr[\"name\"](${bbox.toOverpassBbox()});")
        }
        if (deliveryHint) {
          append("nwr[\"delivery\"=\"yes\"](${bbox.toOverpassBbox()});")
        }
      }
      val textFilter = if (query.trim().isNotEmpty()) ";" else ""
      return "[out:json][timeout:25];($clauses$textFilter);out center;"
    }

    fun parseOverpassElements(
      elements: JSONArray,
      locality: LocalityRegion,
      fallbackCategory: BusinessCategory,
      referenceCenter: GeoPointCoord,
    ): List<DirectoryBusiness> {
      val result = mutableListOf<DirectoryBusiness>()
      for (i in 0 until elements.length()) {
        val element = elements.optJSONObject(i) ?: continue
        val tags = element.optJSONObject("tags") ?: JSONObject()
        val name = tags.optString("name").trim()
        if (name.isBlank()) continue

        val latitude = when {
          element.has("lat") -> element.optDouble("lat")
          element.has("center") -> element.optJSONObject("center")?.optDouble("lat") ?: locality.latitude
          else -> locality.latitude
        }
        val longitude = when {
          element.has("lon") -> element.optDouble("lon")
          element.has("center") -> element.optJSONObject("center")?.optJSONObject("lon")?.optDouble("lon") ?: element.optJSONObject("center")?.optDouble("lon") ?: locality.longitude
          else -> locality.longitude
        }

        val category = DirectoryCategories.inferFromOsmTags(tagMap(tags), fallbackCategory)
        val street = tags.optString("addr:street").trim()
        val housenumber = tags.optString("addr:housenumber").trim()
        val address = buildString {
          append(street)
          if (street.isNotBlank() && housenumber.isNotBlank()) append(" ")
          append(housenumber)
        }.ifBlank { tags.optString("addr:full").trim().ifBlank { "Dirección no informada" } }

        val openingHours = tags.optString("opening_hours").trim().ifBlank { null }
        val phone = tags.optString("phone").ifBlank { tags.optString("contact:phone") }
        val whatsapp = extractArgentineWhatsAppCandidate(
          tags.optString("contact:whatsapp").trim().ifBlank { null },
          phone,
        )
        val delivery = tags.optString("delivery").lowercase(Locale.US) in setOf("yes", "only", "designated")
        val distance = haversineMeters(referenceCenter, GeoPointCoord(latitude, longitude))

        result.add(
          DirectoryBusiness(
            id = "osm_${element.optString("type", "nwr")}_${element.optLong("id", i.toLong())}",
            name = name,
            categoryId = category.id,
            categoryName = category.name,
            localityName = locality.name,
            address = address,
            latitude = latitude,
            longitude = longitude,
            phoneNumber = phone.trim().ifBlank { null },
            whatsappNumber = whatsapp,
            websiteUri = tags.optString("website").trim().ifBlank { null },
            description = tags.optString("description").trim().ifBlank { null },
            isOpenNow = evaluateOsmOpeningHours(openingHours, Calendar.getInstance()),
            openingHoursRaw = openingHours,
            hasDelivery = delivery,
            source = BusinessSource.OPENSTREETMAP,
            status = BusinessStatus.APPROVED,
            distanceMeters = distance,
            markerColorArgb = category.markerColorArgb,
          )
        )
      }
      return result
        .sortedBy { it.distanceMeters ?: Float.MAX_VALUE }
        .distinctBy { it.id }
    }

    fun parsePhotonFeatures(raw: String, locality: LocalityRegion): List<PlaceAutocompleteSuggestion> {
      return try {
        val root = JSONObject(raw)
        val features = root.optJSONArray("features") ?: JSONArray()
        buildList {
          for (i in 0 until features.length()) {
            val feature = features.optJSONObject(i) ?: continue
            val properties = feature.optJSONObject("properties") ?: JSONObject()
            val geometry = feature.optJSONObject("geometry")
            val coordinates = geometry?.optJSONArray("coordinates")
            val longitude = coordinates?.optDouble(0, locality.longitude) ?: locality.longitude
            val latitude = coordinates?.optDouble(1, locality.latitude) ?: locality.latitude

            val name = properties.optString("name").trim()
            if (name.isBlank()) continue
            val street = properties.optString("street").trim()
            val house = properties.optString("housenumber").trim()
            val city = properties.optString("city").ifBlank { properties.optString("county") }.trim()
            val secondary = buildString {
              append(street)
              if (street.isNotBlank() && house.isNotBlank()) append(" ")
              append(house)
              if (city.isNotBlank()) {
                if (isNotEmpty()) append(" • ")
                append(city)
              }
            }

            val tags = mutableMapOf<String, String>()
            val osmKey = properties.optString("osm_key").trim()
            val osmValue = properties.optString("osm_value").trim()
            if (osmKey.isNotBlank() && osmValue.isNotBlank()) tags[osmKey] = osmValue
            val category = DirectoryCategories.inferFromOsmTags(tags, DirectoryCategories.AllCategory)
            val business = DirectoryBusiness(
              id = "photon_${properties.optString("osm_type")}_${properties.optLong("osm_id", i.toLong())}",
              name = name,
              categoryId = category.id,
              categoryName = category.name,
              localityName = city.ifBlank { locality.name },
              address = secondary.ifBlank { locality.name },
              latitude = latitude,
              longitude = longitude,
              source = BusinessSource.OPENSTREETMAP,
              status = BusinessStatus.APPROVED,
              markerColorArgb = category.markerColorArgb,
            )

            add(
              PlaceAutocompleteSuggestion(
                placeId = "${properties.optString("osm_type")}_${properties.optLong("osm_id", i.toLong())}",
                primaryText = name,
                secondaryText = secondary,
                business = business,
              )
            )
          }
        }
      } catch (_: Exception) {
        emptyList()
      }
    }

    fun evaluateOsmOpeningHours(raw: String?, calendar: Calendar): Boolean? {
      val value = raw?.trim()?.lowercase(Locale.US) ?: return null
      if (value.isBlank() || value in setOf("con cita previa", "unknown", "appointment")) return null
      if (value == "24/7") return true
      if (value == "off") return false

      val dayCode = when (calendar.get(Calendar.DAY_OF_WEEK)) {
        Calendar.MONDAY -> "mo"; Calendar.TUESDAY -> "tu"; Calendar.WEDNESDAY -> "we"
        Calendar.THURSDAY -> "th"; Calendar.FRIDAY -> "fr"; Calendar.SATURDAY -> "sa"
        else -> "su"
      }
      val nowMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)

      val sections = value.split(';')
      for (section in sections) {
        val part = section.trim()
        val match = Regex("^([a-z]{2}(?:-[a-z]{2}|(?:,[a-z]{2})*)?)\\s+(.+)$").find(part) ?: continue
        val days = match.groupValues[1]
        val times = match.groupValues[2]
        val dayMatches = when {
          days.contains("-") -> {
            val bounds = days.split("-")
            val all = listOf("mo", "tu", "we", "th", "fr", "sa", "su")
            val start = all.indexOf(bounds[0]); val end = all.indexOf(bounds[1])
            val current = all.indexOf(dayCode)
            if (start >= 0 && end >= 0 && current in start..end) true else false
          }
          "," in days -> dayCode in days.split(',').map { it.trim() }
          else -> days == dayCode
        }
        if (!dayMatches) continue
        for (range in times.split(',')) {
          val bounds = range.trim().split('-')
          if (bounds.size != 2) continue
          val start = parseClockMinutes(bounds[0]) ?: continue
          val end = parseClockMinutes(bounds[1]) ?: continue
          if (nowMinutes in start..end) return true
        }
      }
      return false
    }

    fun extractArgentineWhatsAppCandidate(
      whatsappCandidate: String?,
      alternatePhone: String?,
    ): String? {
      val rawCandidates = listOfNotNull(whatsappCandidate, alternatePhone)
      for (raw in rawCandidates) {
        val digits = raw.filter(Char::isDigit)
        if (digits.isEmpty()) continue

        var normalized = digits
        if (normalized.startsWith("54") && normalized.length >= 12) {
          return "+$normalized"
        }
        if (normalized.startsWith("549") && normalized.length >= 12) {
          return "+$normalized"
        }
        if (normalized.startsWith("0")) normalized = normalized.drop(1)
        if (normalized.startsWith("15") && normalized.length >= 9) normalized = normalized.drop(2)

        if (normalized.length == 10 && normalized.startsWith("299")) {
          return "+549$normalized"
        }
        if (normalized.length == 10 && normalized.startsWith("299")) {
          return "+549$normalized"
        }
      }
      return null
    }

    private fun parseClockMinutes(raw: String): Int? {
      val match = Regex("^(\\d{2}):(\\d{2})$").find(raw.trim()) ?: return null
      val hour = match.groupValues[1].toIntOrNull() ?: return null
      val minute = match.groupValues[2].toIntOrNull() ?: return null
      if (hour !in 0..23 || minute !in 0..59) return null
      return hour * 60 + minute
    }

    private fun tagMap(tags: JSONObject): Map<String, String> {
      val map = mutableMapOf<String, String>()
      tags.keys().forEach { key -> map[key] = tags.optString(key) }
      return map
    }

    private fun haversineMeters(a: GeoPointCoord, b: GeoPointCoord): Float {
      val earthRadius = 6371000.0
      val lat1 = Math.toRadians(a.latitude)
      val lat2 = Math.toRadians(b.latitude)
      val deltaLat = lat2 - lat1
      val deltaLon = Math.toRadians(b.longitude - a.longitude)
      val value = kotlin.math.sin(deltaLat / 2) * kotlin.math.sin(deltaLat / 2) +
        kotlin.math.cos(lat1) * kotlin.math.cos(lat2) *
        kotlin.math.sin(deltaLon / 2) * kotlin.math.sin(deltaLon / 2)
      val c = 2 * kotlin.math.atan2(kotlin.math.sqrt(value), kotlin.math.sqrt(1 - value))
      return (earthRadius * c).toFloat()
    }
  }
}
