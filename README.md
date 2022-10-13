# pf2edragruler

Integration of the Drag Ruler module (https://github.com/manuelVo/foundryvtt-drag-ruler) for Pathfinder 2e with support for the 3 action economy. 
With simple action tracking, that can handle the restrained, immobilized, paralyzed, quickened, slowed and stunned conditions. 

Terrain Ruler (https://foundryvtt.com/packages/terrain-ruler) is required for difficult terrain to be recognized. And Drag Ruler now requires SocketLib (https://foundryvtt.com/packages/socketlib)

Either Enhanced Terrain Layer(https://github.com/ironmonk88/enhanced-terrain-layer) or Terrain Layer (https://foundryvtt.com/packages/TerrainLayer/) are supported as a means to place dificult terrain. Note: The latter two modules are mutally exclusive. 

![3 Action Example](https://imgur.com/fqtgojg.png)

![Quickened Example](https://imgur.com/z0Fo1Da.png)

![Slowed Example](https://imgur.com/49ZJDF6.png)

Drag Ruler now supports customizable colours. The default colours for PF2e integration should be distinguishable for people with protanopia, deuteranopia, or tritanopia.

Settings exist to automatically switch to use fly speed, if a creature has one, when a token is elevated, and automatically switch to burrow speed if a token has negative elevation. You can also tell a token to use its Swim, Fly, Burrow or Climb speed manually by dragging the appropriate effect from the movement types compendium. Tokens without the appropriate speed will default to their land speed instead. And will not be treated as flying or swimming for the purposes of difficult terrain. 

![image](https://user-images.githubusercontent.com/74130268/116287549-c8e98680-a74d-11eb-83ee-5e1d13039413.png)

Due to API changes, all advanced Enhanced Terrain Layer features that allow for modifying how a token interacts with difficult terrain have been temporarily removed. 

Options have been added to treat each individual drag event as a seperate action, and to ignore any off-turn movements (for example reactions), when tracking on-turn movement history. 
