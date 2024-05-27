# Virutal world in JavaScript from scratch

## generate the map from your location
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

## Decode the map
 - Save the generated map as `myMap.js` in the `data` folder. See examples
 - Make sure to assign the generated map data to `myMap` variable  in the myMap.js file
 - Run `createAndSaveWorld();` to generate the world data
 - save the generated world data as `myWorld.js` in the `data` folder
 - Make sure to assign the generated world data to `worldData` variable  in the myWorld.js file
 - add the myWorld.js to the index.html file
 - Run the index.html file in the browser