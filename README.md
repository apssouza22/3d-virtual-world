## Map

# generate the map from your location
 - Access https://overpass-turbo.eu/
 - Query 
```
[out:json];
   (
   way["highway"]
   ({{bbox}});
   );
   out body;
>;
out skel;
```