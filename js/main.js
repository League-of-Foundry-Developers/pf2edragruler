import {registerSettings} from "./settings.js"
import {movementTracking, actionCount} from "./movementFunctions.js"

Hooks.once("init", () => {
	//Wait until the game is initialized, then register the settings created previously.
	registerSettings();
});
Hooks.once("ready", () => {
	if (game.modules.get("terrain-ruler").active){
		ui.notifications.warn("Terrain Ruler Detected - You may experience crashes, deactivation recommended");
	}
});
Hooks.once("dragRuler.ready", (SpeedProvider) => {
	class PF2eSpeedProvider extends SpeedProvider {
	  //Registers colours for up to four movement actions so colours can be customized for them, and sets defaults
	  get colors(){
	  return [
	    {id: "FirstAction", default: 0x3222C7},
	    {id: "SecondAction", default: 0xFFEC07},
	    {id: "ThirdAction", default: 0xC033E0},
	    {id: "FourthAction", default: 0x1BCAD8}
	  ]
	  };
	  // Get the distance for each movement interval to give to drag ruler
	  getRanges(token){
	  var numactions = actionCount(token); //Use the actionCount function to determine how many actions that token gets each round.
	  var movement = movementTracking(token); //Use the movementTracking function to get how far each movement range should be.
	  const ranges = []; //create blank array to store the ranges in.

	  if (numactions > 0 && movement.A1 > 0){
	  //Set the ranges for each of our four actions to be given to the drag ruler.
	  ranges.push({range: movement.A1, color: "FirstAction"},{range: movement.A2, color: "SecondAction"}, { range: movement.A3, color: "ThirdAction"},{range: movement.A4, color: "FourthAction"});
	  //Remove ranges from the function until only the ranges equal to the number of legal actions remain.
	   for (var i = numactions, len=ranges.length; i<len; i++){
	    ranges.pop();
	   };
	  } else {ranges.push({range: 0, color: "FirstAction"})}; //Since ranges is empty if you've got no actions add a range for the first action of 0.
	  return ranges;
	  };
	  };
// When dragruler is ready to go give it all the PF2 specific stuff
	dragRuler.registerModule("pf2e-dragruler", PF2eSpeedProvider) //register the speed provider so its selectable from the drag ruler configuration.
});
