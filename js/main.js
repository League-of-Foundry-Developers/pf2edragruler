import {registerSettings} from "./settings.js"
import {movementTracking, actionCount} from "./movementFunctions.js"

Hooks.once("init", () => {
	//Wait until the game is initialized, then register the settings created previously.
	registerSettings();
});
Hooks.once("canvasInit", () => {
	//When the canvas intializes the first time after a reload, if enhanced terrain layer is active, overwrite the original environment/obstacle lists with a PF2e specific list.
 if (game.modules.get("enhanced-terrain-layer")?.active){
	canvas.terrain.getEnvironments = function(){return [
		{ id: 'aquatic', text: game.i18n.localize("pf2e-dragruler.canvas.Aquatic"), icon:'systems/pf2e/icons/spells/crashing-wave.webp'},
		{ id: 'arctic', text: game.i18n.localize("pf2e-dragruler.canvas.Arctic"), icon:'systems/pf2e/icons/spells/warped-terrain.webp' },
		{ id: 'coast', text: game.i18n.localize("pf2e-dragruler.canvas.Coast"), icon:'systems/pf2e/icons/features/ancestry/skilled-heritage.webp' },
		{ id: 'desert', text: game.i18n.localize("pf2e-dragruler.canvas.Desert"), icon:'systems/pf2e/icons/spells/dust-storm.webp' },
		{ id: 'forest', text: game.i18n.localize("pf2e-dragruler.canvas.Forest"), icon:'systems/pf2e/icons/spells/plant-growth.webp' },
		{ id: 'hills', text: game.i18n.localize("pf2e-dragruler.canvas.Hills"), icon:'systems/pf2e/icons/spells/passwall.webp' },
		{ id: 'mountain', text: game.i18n.localize("pf2e-dragruler.canvas.Mountain"), icon:'systems/pf2e/icons/spells/stone-tell.webp' },
		{ id: 'plains', text: game.i18n.localize("pf2e-dragruler.canvas.Plains"), icon:'systems/pf2e/icons/spells/commune-with-nature.webp' },
		{ id: 'sky', text: game.i18n.localize("pf2e-dragruler.canvas.Sky"), icon:'systems/pf2e/icons/spells/darkness.webp' },
		{ id: 'swamp', text: game.i18n.localize("pf2e-dragruler.canvas.Swamp"), icon:'systems/pf2e/icons/spells/blight.webp' },
		{ id: 'underground', text: game.i18n.localize("pf2e-dragruler.canvas.Underground"), icon:'systems/pf2e/icons/spells/dance-of-darkness.webp' },
		{ id: 'urban', text: game.i18n.localize("pf2e-dragruler.canvas.Urban"), icon:'systems/pf2e/icons/spells/pulse-of-the-city.webp' },
		{ id: 'current', text: game.i18n.localize("pf2e-dragruler.canvas.Current"), icon:'systems/pf2e/icons/spells/air-walk.webp', obstacle:true },
		{ id: 'crowd', text: game.i18n.localize("pf2e-dragruler.canvas.Crowd"), icon:'systems/pf2e/icons/spells/tireless-worker.webp' , obstacle:true},
		{ id: 'furniture', text: game.i18n.localize("pf2e-dragruler.canvas.Furniture"), icon:'systems/pf2e/icons/spells/secret-chest.webp', obstacle:true},
		{ id: 'ice', text: game.i18n.localize("pf2e-dragruler.canvas.Ice"), icon:'systems/pf2e/icons/spells/clinging-ice.webp', obstacle:true},
		{ id: 'incline', text: game.i18n.localize("pf2e-dragruler.canvas.Incline"), icon:'systems/pf2e/icons/spells/unimpeded-stride.webp', obstacle:true },
		{ id: 'magical', text: game.i18n.localize("pf2e-dragruler.canvas.Magical"), icon:'systems/pf2e/icons/default-icons/spell.webp', obstacle:true},
		{ id: 'plants', text: game.i18n.localize("pf2e-dragruler.canvas.Plants"), icon:'systems/pf2e/icons/spells/natures-enmity.webp', obstacle:true },
		{ id: 'rubble', text: game.i18n.localize("pf2e-dragruler.canvas.Rubble"), icon:'systems/pf2e/icons/spells/wall-of-stone.webp', obstacle:true },
		{ id: 'water', text: game.i18n.localize("pf2e-dragruler.canvas.Water"), icon:'systems/pf2e/icons/spells/mariners-curse.webp', obstacle:true },
		{ id: 'wind', text: game.i18n.localize("pf2e-dragruler.canvas.Wind"), icon:'systems/pf2e/icons/spells/punishing-winds.webp', obstacle:true }
	];
	}
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

Hooks.on('updateCombat', () => {
	if(game.user.isGM && game.settings.get("drag-ruler", "enableMovementHistory") && game.settings.get("pf2e-dragruler", "offTurnMovement")){
		const combat = game.combats.active; //set the current combat
		if(combat?.turns.length > 0){
		 const previousCombatant = combat.turns[(combat.turn - 1) < 0 ? (combat.turns.length - 1) : (combat.turn - 1)];
		 const nextCombatant = combat.turns[combat.turn]; //find the next combatant
		 	if(nextCombatant?.flags?.dragRuler){
			 dragRuler.resetMovementHistory(combat, nextCombatant._id); //if movement history exists, clears it for the next combatant prior to acting. Gives a clean slate for the new turn, important for clearing out off turn movement.
		 	};
			if(previousCombatant?.flags?.dragRuler){
			 dragRuler.resetMovementHistory(combat, previousCombatant._id); //if movement history exists, clears it for the next combatant prior to acting. Gives a clean slate for the new turn, important for clearing out off turn movement.
		 	};
		};
 };
});

Hooks.once("enhancedTerrainLayer.ready", (RuleProvider) => {
  class PF2eRuleProvider extends RuleProvider {
    calculateCombinedCost(terrain, options) {
			const token = options?.token;
			const tokenElevation = token?.document?.elevation || 0
			let cost;
			if(token){
			var movementType = movementTracking(token).type; //gets type of movement.
			 //gets token elevation.
			var ignoredEnv= Object.keys(token.actor.flags.pf2e?.movement?.env?.ignore || {any: false} ).filter(a => token.actor.flags.pf2e?.movement?.env?.ignore?.[a]);  //finds all the flags set by effects asking the actor to ignore a type of terrain.
			var reducedEnv= Object.keys(token.actor.flags.pf2e?.movement?.env?.reduce || {any: false} ).filter(a => token.actor.flags.pf2e?.movement?.env?.reduce?.[a]); //finds all the flags set by effects asking the actor to reduce the cost of a type of terrain.
			if(token.actor.flags.pf2e?.movement?.ignoreTerrain|| token.actor.flags.pf2e?.movement?.climbing){
				cost = 1
			  return cost
			};
		}
//Function for Minus Equal, minimum 1.
      function mem1(a, value){
				if(a <= value){return 1}
				else{return (a - value)}
			}
	    let environments = [];
			let obstacles = [];
			let costs = [];
		for(var ii = 0; ii<terrain.length; ii++) {
			if(terrain[ii].object.document.top >= tokenElevation && terrain[ii].object.document.bottom <= tokenElevation && (token?.actor?.alliance ?? "none" !== (terrain[ii].object?.actor?.alliance ?? 0))){
				environments.push(terrain[ii].environment)
				obstacles.push(terrain[ii].obstacle)
				costs.push(terrain[ii].cost)
				if(token && !token.actor.flags.pf2e?.movement?.respectTerrain){
				if(reducedEnv?.find(e => e == 'non-magical') && (environments[ii] !== 'magical' || obstacles[ii] !== 'magical')){
					costs[ii] = mem1(costs[ii],1)
				}
				if(ignoredEnv?.find(e => e == 'non-magical') && (environments[ii] !== 'magical' || obstacles[ii] !== 'magical')){
					costs[ii] = 1
				}
			 }
		  }
	   }
    // Calculate the cost for this terrain
		if(token && !token.actor.flags.pf2e?.movement?.respectTerrain){
	   for(var i = 0; i < environments.length; i++){
				if(reducedEnv?.find(e => e == environments[i])||reducedEnv?.find(e => e == obstacles[i])||token.actor.flags.pf2e?.movement?.reduceTerrain){costs[i] = mem1(costs[i],1)}
				if(ignoredEnv?.find(e => e == environments[i])||ignoredEnv?.find(e => e == obstacles[i])){costs[i]=1}
				if (movementType == 'swim' && obstacles[i] == "water" || movementType == 'swim' && environments[i] == "water" ){costs[i]=1}
				if (movementType == 'burrow' && obstacles[i] == "underground" || movementType == 'burrow' && environments[i] == "underground" ){costs[i]=1}
			}
		}
		  costs.push(1);
			cost = Math.max(...costs)
			if(token && token.actor.flags.pf2e?.movement?.increaseTerrain){cost += 1}
      return cost;
    }
  }
  enhancedTerrainLayer.registerModule("pf2e-dragruler", PF2eRuleProvider);
});
