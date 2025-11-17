# ✅ **1. Using OpenStreetMap (Free API – Nominatim)**

**Free**, no API key required (rate-limited).

### Example request:

```
https://nominatim.openstreetmap.org/reverse?lat=35.6892&lon=51.3890&format=json
```

### Response contains:

```json
{
  "address": {
    "city": "Tehran",
    "state": "Tehran Province",
    "country": "Iran"
  }
}
```

---

# ✅ **2. Using Google Maps Geocoding API (Most Accurate)**

Requires API key.

### Request:

```
https://maps.googleapis.com/maps/api/geocode/json?latlng=35.6892,51.3890&key=YOUR_API_KEY
```

### Response includes:

* city
* district
* country
* postal code
  … and much more.

---

# ✅ **3. Using a Node.js package (If you're in a backend)**

### NPM: `node-geocoder`

```bash
npm install node-geocoder
```

### Usage:

```js
import NodeGeocoder from 'node-geocoder';

const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

const res = await geocoder.reverse({ lat: 35.6892, lon: 51.3890 });
console.log(res);
```
---

# ✅ **5. Offline (If you need speed or privacy)**

Install and run a **local Nominatim server**.

You can reverse-geocode **completely offline** using OSM planet data.
