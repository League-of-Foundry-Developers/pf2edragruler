# pf2edragruler

Integration of the Drag Ruler module (https://github.com/manuelVo/foundryvtt-drag-ruler) for Pathfinder 2e with support for the 3 action economy. 
With simple action tracking, that can handle the restrained, immobilized, paralyzed, quickened, slowed and stunned conditions. 

Terrain Ruler (https://foundryvtt.com/packages/terrain-ruler) is required for difficult terrain to be recognized. And Drag Ruler now requires SocketLib (https://foundryvtt.com/packages/socketlib)
Either Enhanced Terrain Layer(https://github.com/ironmonk88/enhanced-terrain-layer) or Terrain Layer (https://foundryvtt.com/packages/TerrainLayer/) are supported as a means to place dificult terrain. Note: The latter two modules are mutally exclusive. 

![3 Action Example](https://imgur.com/fqtgojg.png)

![Quickened Example](https://imgur.com/z0Fo1Da.png)

![Slowed Example](https://imgur.com/49ZJDF6.png)

Drag Ruler now supports customizable colours. The default colours for PF2E integration should be distinguishable for people with protanopia, deuteranopia, or tritanopia.

Settings exist to automatically switch to use fly speed, if a creature has one, when a token is elevated, and autpmatically switch to burrow speed if a token has negative elevation. This same setting also supports switching to swim speed if you move begins in water, or aquatic terrain. Tokens without the appropriate speed will default to their land speed instead. And will not be treated as flying or swimming for the purposes of difficult terrain. 

A second setting has been added to support Enhanced Terrain Layer's  scene environements. When this setting is enabled, if you set a scene environment to Sky, all tokens will use a fly speed if they have one in that scene, and if you set the scene environment to aquatic all tokens will use a swim speed if they have one. Tokens without either speed will default to their land speed instead. And will not be treated as flying or swimming for the purposes of difficult terrain.

You can also tell a token to use its Swim, Fly, Burrow or Climb speed manually by dragging the appropriate effect from the movement types compendium.

![image](https://user-images.githubusercontent.com/74130268/116287549-c8e98680-a74d-11eb-83ee-5e1d13039413.png)

As part of the Enhanced Terrain Layer support, PF2e drag ruler integration includes a list of PF2e specific environments and obstacles. Furthermore, example effects that allow you to reduce the cost of a specific type of difficult terrain or ignore it all together have been included in the bundled movement effects compendium. 

![image](https://user-images.githubusercontent.com/74130268/116287823-1960e400-a74e-11eb-8338-774d04142b6b.png)


