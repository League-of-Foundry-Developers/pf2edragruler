function registerSettings() {
	// Create the setting for Automatic Movement switching for later use.
	game.settings.register("pf2e-dragruler", "auto", {
		name: "Automatic Movement Switching",
		hint: "If enabled, positive elevations will automatically use fly speed, negative elevations will use burrow, and tokens in water, or aquatic terrain will use swim speeds, if an actor does not have that speed, will use their land speed.",
		scope: "world",
		config: true,
		type: Boolean,
		default: false
}),
// Create the setting for automatically switching movement type based on a scene's environment.
game.settings.register("pf2e-dragruler", "scene", {
	name: "Scene Environment Automation",
	hint: "If enabled, actors in Sky scenes will automatically use fly speed, and those in aquatic terrain will use swim speeds, if an actor does not have a speed, will use their land speed.",
	scope: "world",
	config: true,
	type: Boolean,
	default: false
})
};

Hooks.once("init", () => {
	//Wait until the game is initialized, then register the settings created previously.
	registerSettings();
});

Hooks.once("canvasInit", () => {
	//When the canvas intializes the first time after a reload, if enhanced terrain layer is active, overwrite the original environment/obstacle lists with a PF2e specific list.
 if (game.modules.get("enhanced-terrain-layer")?.active){
	canvas.terrain.getEnvironments = function(){return [
		{ id: 'aquatic', text: 'Aquatic', icon:'systems/pf2e/icons/spells/crashing-wave.webp'},
		{ id: 'arctic', text: 'Arctic', icon:'systems/pf2e/icons/spells/warped-terrain.webp' },
		{ id: 'coast', text: 'Coast', icon:'systems/pf2e/icons/features/ancestry/skilled-heritage.webp' },
		{ id: 'desert', text: 'Desert', icon:'systems/pf2e/icons/spells/tireless-worker.webp' },
		{ id: 'forest', text: 'Forest', icon:'systems/pf2e/icons/spells/plant-growth.webp' },
		{ id: 'hills', text: 'Hills', icon:'systems/pf2e/icons/spells/passwall.webp' },
		{ id: 'mountain', text: 'Mountain', icon:'systems/pf2e/icons/spells/stone-tell.webp' },
		{ id: 'plains', text: 'Plains', icon:'systems/pf2e/icons/spells/commune-with-nature.webp' },
		{ id: 'sky', text: 'Sky', icon:'systems/pf2e/icons/spells/darkness.webp' },
		{ id: 'swamp', text: 'Swamp', icon:'systems/pf2e/icons/spells/blight.webp' },
		{ id: 'underground', text: 'Underground', icon:'systems/pf2e/icons/spells/dance-of-darkness.webp' },
		{ id: 'urban', text: 'Urban', icon:'systems/pf2e/icons/spells/pulse-of-the-city.webp' },
		{ id: 'current', text: 'Current', icon:'systems/pf2e/icons/spells/air-walk.webp', obstacle:true },
		{ id: 'crowd', text: 'Crowd', icon:'systems/pf2e/icons/spells/tireless-worker.webp' , obstacle:true},
		{ id: 'furniture', text: 'Furniture', icon:'systems/pf2e/icons/spells/secret-chest.webp', obstacle:true},
		{ id: 'ice', text: 'Ice', icon:'systems/pf2e/icons/spells/clinging-ice.webp', obstacle:true},
		{ id: 'incline', text: 'Incline', icon:'systems/pf2e/icons/spells/unimpeded-stride.webp', obstacle:true },
		{ id: 'magical', text: 'Magical', icon:'systems/pf2e/icons/default-icons/spell.webp', obstacle:true},
		{ id: 'plants', text: 'Plants', icon:'systems/pf2e/icons/spells/natures-enmity.webp', obstacle:true },
		{ id: 'rubble', text: 'Rubble', icon:'systems/pf2e/icons/spells/wall-of-stone.webp', obstacle:true },
		{ id: 'water', text: 'Water', icon:'systems/pf2e/icons/spells/mariners-curse.webp', obstacle:true },
		{ id: 'wind', text: 'Wind', icon:'systems/pf2e/icons/spells/punishing-winds.webp', obstacle:true }
	];
	}
 }
});

Hooks.once("dragRuler.ready", (SpeedProvider) => {
// When dragruler is ready to go give it all the PF2 specific stuff
	class PF2ESpeedProvider extends SpeedProvider {
//Registers colours for up to four movement actions so colours can be customized for them, and sets defaults
		get colors() {
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
			token.actor.setFlag('pf2e', 'actions.remainingActions', (numactions - movement.usedActions)); //Set a flag with the number of remaining actions, so the number can be called by the player. If drag rulers movement history tracking is off, will not updated based on movement.

		if (numactions > 0 && movement.A1 > 0){
			//Set the ranges for each of our four actions to be given to the drag ruler.
			ranges.push({range: movement.A1, color: "FirstAction"},{range: movement.A2, color: "SecondAction"}, { range: movement.A3, color: "ThirdAction" },{range: movement.A4, color: "FourthAction"});
			//Remove ranges from the function until only the ranges equal to the number of legal actions remain.
			 for (var i = numactions, len=ranges.length; i<len; i++){
				ranges.pop();
			 };
		 } else {ranges.push({range: 0, color: "FirstAction"})}; //Since ranges is empty if you've got no actions add a range for the first action of 0.
			return ranges;
		};

		getCostForStep(token, area){
			//this handles all the difficult terrain stuff.
			var reduced = envReductions(token); //the envReductions functions pulls information about any types of difficult terrain the token should ignore, or reduce the cost of.
			//if the token is flying, but the elevation hasn't been modified, treat the elevation as 1, enhanced terrain layer recognizes the token as being affected by air terrain. If the token has been set to respect difficult terrain regardless of usual reductions, treat the elevation as undefined to bypass enhanced terrain rulers ignoring terrain based on elevation. Otherwise treat the token elevation as the tokens actual elevation.
			if( movementSpeed(token).type === 'fly' && token.data.elevation <= 0){var tokenElevation = 1} else if(reduced === "respect"){var tokenElevation = undefined} else {var tokenElevation = token.data.elevation};
			// Lookup the cost for each square occupied by the token
			if (reduced === "ignore"){ return 1 } else {
				//if all difficult terrain is being ignored, skip the whole process and treat the cost per movement as 1.
					if (game.modules.get("enhanced-terrain-layer")?.active === true){
						// method for calculating difficult terrain if enhanced terrain layer is active
					 if (reduced === "respect"){ reduced = [];} // if the token has been set to respect all difficult terrain, set the array of reductions to blank.
					 const costs = area.map(space => canvas.terrain.cost([space],{tokenId:token.data._id, elevation:tokenElevation, reduce:reduced})); // determine the cost of movement
				 // Return the maximum of the costs
					 var calcCost = costs.reduce((max, current) => Math.max(max, current))
				 } else {
					 //method for calculating difficult terrain if the old terrain layer module is in use.
					 	const costs = area.map(space => canvas.terrain.costGrid[space.y]?.[space.x]?.multiple ?? 1);
					 	var calcCost = costs.reduce((max, current) => Math.max(max, current));
					 }
					 if (reduced === "reduce" && calcCost > 1) {calcCost -= 1} //If the token is set to reduce the cost of all difficult terrain, reduce the calculated costs. For enhanced terrain ruler this is handled by envReductions
					 return calcCost;
				 }
			};
	}

	dragRuler.registerModule("pf2e-dragruler", PF2ESpeedProvider) //register the speed provider so its selectable from the drag ruler configuration.
});

Hooks.on('preUpdateCombat', () => {
	const combat = game.combats.active; //set the current combat
	const combatant = combat.turns[combat.turn]; //find the current combatant
	const nextCombatant = combat.turns[(combat.turn + 1) > (combat.turns.length - 1) ? 0 : (combat.turn + 1)]; //find the next combatant
	combatant.actor.unsetFlag('pf2e', 'actions'); //clear all the action tracking flags from the current combatant.
	nextCombatant.actor.unsetFlag('pf2e', 'actions'); //clear all the action tracking flags from the next combatant. (Proved to be necessary to handle off turn movement.)
 if(game.settings.get("drag-ruler", "enableMovementHistory") === true){
	const flags = {trackedRound: 0, rulerState: null};
	import("/modules/drag-ruler/src/socket.js").then(module => module.updateCombatantDragRulerFlags(combat, combatant, flags)); //if movement history exists, for the combatant (which is actually the actor whos turn just finished) clears it. Also important for off turn movement.
	import("/modules/drag-ruler/src/socket.js").then(module => module.updateCombatantDragRulerFlags(combat, nextCombatant, flags)); //if movement history exists, clears it for the next combatant prior to acting. Gives a clean slate for the new turn, important for clearing out off turn movement.
 };
});

function cleanSpeed(token) {
var land = 0; var fly = 0; var swim = 0; var climb = 0; var burrow = 0; var miscSpeed =0; //set empty variables for each speed, so JS doesn't complain later. Some comments refer to these as the OG variables because I'm extra like that.
	//handles speeds for PCs
	if (token.actor.data.type === "character"){
		const cleanedSpeeds = speedsSorter(token) //This grabs and cleans most of the speeds from the actor.
		var land = cleanedSpeeds.land; var fly = cleanedSpeeds.fly; var swim = cleanedSpeeds.swim; var climb = cleanedSpeeds.climb; var burrow = cleanedSpeeds.burrow; var miscSpeed =cleanedSpeeds.misc; //Assigns the cleaned speeds to the appropriate variables
		var land = parseFloat(token.actor.data.data.attributes.speed.total); //land speed usually isn't under other speeds for PCs, so we need to grab that as well.
		//handles speeds for NPCs
	} else if (token.actor.data.type === "npc"){
		const cleanedSpeeds = speedsSorter(token) //Same as above. Grabs most of the speeds.
		var land = cleanedSpeeds.land; var fly = cleanedSpeeds.fly; var swim = cleanedSpeeds.swim; var climb = cleanedSpeeds.climb; var burrow = cleanedSpeeds.burrow; var miscSpeed =cleanedSpeeds.misc; //Assigns the cleaned speeds to the appropriate variables
		// Like with PCs in addition to the "other speeds" grabbed by the speedsSorter function the NPC will have a main speed, in some cases this isn't a land speed so we need to figure out what kind of speed it is and assign it to the approriate variable.
		if(token.actor.data.data.attributes.speed.type === "land" || token.actor.data.data.attributes.speed.type === "Land" ){
			var land = parseFloat(token.actor.data.data.attributes.speed.total)
		} else if (token.actor.data.data.attributes.speed.type === "fly" || token.actor.data.data.attributes.speed.type === "Fly") {
			var fly = parseFloat(token.actor.data.data.attributes.speed.total);
		} else if (token.actor.data.data.attributes.speed.type === "swim" || token.actor.data.data.attributes.speed.type === "Swim") {
			var swim = parseFloat(token.actor.data.data.attributes.speed.total);
		}	else if (token.actor.data.data.attributes.speed.type === "climb" || token.actor.data.data.attributes.speed.type === "Climb" ) {
			var climb = parseFloat(token.actor.data.data.attributes.speed.total);
		} else if (token.actor.data.data.attributes.speed.type === "burrow" || token.actor.data.data.attributes.speed.type === "Burrow") {
			var burrow = parseFloat(token.actor.data.data.attributes.speed.total);
		} else{var miscSpeed = parseFloat(token.actor.data.data.attributes.speed.total)};
		// Sometimes an NPC is a disaster, and we've got no main speed. In which cause land speed will still have its default value (0). But there might be a speed that's being handled poorly that didn't make it from the .value to the .total function so we should parse that.
		if (land === 0 && token.actor.data.data.attributes.speed.value !== undefined) {
		var miscSpeed = 0; //Set the speed to 0 as a fall back.
			if (token.actor.data.data.attributes.speed.value !== null && token.actor.data.data.attributes.speed.value !== undefined){
				var miscSpeed = parseFloat(token.actor.data.data.attributes.speed.value.match(/\d+(\.\d+)?/)); //in the event we really do have a speed in .value that didn't make it to .total, covert it to a number, and assign it. If the conditions above are both false, speed will be treated as 0, the fallback from above.
			}
		};
		//What else. Familiars
	} else if (token.actor.data.type === "familiar"){
		//Works pretty normally, just need to grab the appropriate other speeds from the speedsSorter. Since that's where everything is stored when you're a familiar. Hellish. We then assign to the appropriate values. As I'm sure is becoming routine. Yawn.
		const cleanedSpeeds = speedsSorter(token)
		var land = cleanedSpeeds.land; var fly = cleanedSpeeds.fly; var swim = cleanedSpeeds.swim; var climb = cleanedSpeeds.climb; var burrow = cleanedSpeeds.burrow; var miscSpeed =cleanedSpeeds.misc;

		//vehicles don't have other speeds as an option, for reasons (tm). They also store their speed in a different place. Don't look at me, I'm busy wishing death on everything too. If its a vehicle just grab its speed info and assign to the land variable. You can write the ticket later.
	} else if (token.actor.data.type === "vehicle"){
		var land = parseFloat(token.actor.data.data.details.speed)
	}
	//This is were we set up an array of speeds to be made available as the output from this function.
	// When the speed overhaul of PF2 occurs so long as the final results can be cohereced into this array format everything else will continue to function normally.
	const speeds = []; // Blank so that we can push things to it.
	if (land > 0) {speeds.push({id: "land", value: land})}; //If you've got a land speed, add it as an array to the array, which becomes a matrix. JS matrixes are satanic. But don't panic. Or do. Your call.
	if (fly > 0) {speeds.push({id: "fly", value: fly})}; //If you've got a fly speed add it as an array to the array.
	if (miscSpeed > 0) {speeds.push({id: "misc", value: miscSpeed})}; //If you've got a an uncategorized speed add it.
	if (swim > 0) {speeds.push({id: "swim", value: swim})}; //Same for swim speed
	if (burrow > 0) {speeds.push({id: "burrow", value: burrow})}; //and burrow
	if (climb > 0) {speeds.push({id: "climb", value: climb})}; // why the hell not, climb too. This order matters at it sets which speed is the default speed used for dragging. The default speed used in the first one to show up in the speed matrix
	if (speeds.length === 0) {speeds.push({id: "land", value: 0})}; //If we've got this far and our speed matrix is empty make the land speed 0, the token ain't moving for shit, but hey you won't get an error. <3

	return speeds //output this shit so it can be read, used back in line 16 -ish. Or at least its line 16 at time of writing. Search for the function "cleanSpeed" if you can't find. If you still can't find it look for glasses.
};
//So this actually does a lot of the grabby grabby stuff. Pulls out all the speeds stored under other speeds.
function speedsSorter (token) {
var land2 = 0; var fly2 = 0; var swim2 = 0; var climb2 = 0; var burrow2 = 0; var miscSpeed2 =0;
if (token.actor.data.data.attributes.speed.otherSpeeds !== undefined){
	//skips this if no other speeds exist.
	for (var i=0, len=token.actor.data.data.attributes.speed.otherSpeeds.length; i<len; i++){
		//iterates through other speeds assigning to the appropriate variables. Different from the OG ones for sanities sake. Will later get assined to the OG ones.
		if(token.actor.data.data.attributes.speed.otherSpeeds[i].type === "land" || token.actor.data.data.attributes.speed.otherSpeeds[i].type === "Land"){
			var land2 = parseFloat(token.actor.data.data.attributes.speed.otherSpeeds[i].total)
		} else if (token.actor.data.data.attributes.speed.otherSpeeds[i].type === "fly" || token.actor.data.data.attributes.speed.otherSpeeds[i].type === "Fly") {
			var fly2 = parseFloat(token.actor.data.data.attributes.speed.otherSpeeds[i].total);
		} else if (token.actor.data.data.attributes.speed.otherSpeeds[i].type === "swim" || token.actor.data.data.attributes.speed.otherSpeeds[i].type === "Swim") {
			var swim2 = parseFloat(token.actor.data.data.attributes.speed.otherSpeeds[i].total);
		}	else if (token.actor.data.data.attributes.speed.otherSpeeds[i].type === "climb" || token.actor.data.data.attributes.speed.otherSpeeds[i].type === "Climb" ) {
			var climb2 = parseFloat(token.actor.data.data.attributes.speed.otherSpeeds[i].total);
		} else if (token.actor.data.data.attributes.speed.otherSpeeds[i].type === "burrow" || token.actor.data.data.attributes.speed.otherSpeeds[i].type === "Burrow" ) {
			var burrow2 = parseFloat(token.actor.data.data.attributes.speed.otherSpeeds[i].total);
		} else{var miscSpeed2 = parseFloat(token.actor.data.data.attributes.speed.otherSpeeds[i].total)}
	}
};
return {land: land2, fly: fly2, swim: swim2, burrow: burrow2, climb: climb2, misc: miscSpeed2}
//returns them all as a since simple array, easy to grab from for assigning to our lovely OG variables.
}

//this function handles determining the type of movment.
function movementSelect (token) {
	const tokenElevation = token.data.elevation; //Gives us a way to check if a token is flying
	var movementType = 'default';

//This logic gate handles flight and swimming, if the scene environment based movement switching is on.
if (game.settings.get("pf2e-dragruler", "scene")=== true) {
	if(canvas.scene.data.flags?.['enhanced-terrain-layer']?.environment == 'sky') {var movementType = 'fly'}; //checks if the scene is set to have a default environment of sky. If so, uses fly speed.
	if(canvas.scene.data.flags?.['enhanced-terrain-layer']?.environment == 'aquatic'){var movementType = 'swim'}; //checks if the scene is set to have a default environment of aquatic. If so, uses swim speed.
};

//This logic gate handles flight, burrowing and swimming, if the automatic movment switching is on.
if (game.settings.get("pf2e-dragruler", "auto")=== true) {
	if(tokenElevation > 0) {var movementType = 'fly'}; //if elevated fly
	if (tokenElevation < 0){var movementType = 'burrow'}; //if below ground burrow.
	if (game.modules.get("enhanced-terrain-layer")?.active){if(canvas.terrain.terrainAt(token.data.x/100,token.data.y/100)[0]?.environment === 'aquatic' || canvas.terrain.terrainAt(token.data.x/100,token.data.y/100)[0]?.environment === 'water'){var movementType = 'swim'}}; //switches to swim speed, if the token starts the movement in water or aquatic terrain.
};

if(token.actor.data.flags.pf2e?.movement?.burrowing === true){var movementType = 'burrow'} //switches to burrowing if the burrow effect is applied to the actor.
if(token.actor.data.flags.pf2e?.movement?.climbing === true){var movementType = 'climb'} //switches to climbing if the climb effect is applied to the actor.
if(token.actor.data.flags.pf2e?.movement?.swimming === true){var movementType = 'swim'} //switches to swimming if the swim effect is applied to the actor.
if(token.actor.data.flags.pf2e?.movement?.flying === true){var movementType = 'fly'} //switches to flying if the fly effect is applied to the actor.

return movementType
};

function movementSpeed (token) {
	const tokenSpeed = cleanSpeed(token); //This does most of the heavy lifting in terms of giving us all the base speeds for a token.
	var movement = movementSelect(token); //returns the type of movement to return.

	 //Sets base speed to the default value.
	if (movement === "burrow") {var baseSpeed = tokenSpeed.find(e => e.id == "burrow")?.value} // If movement type is set to burrowing, sets base speed to burrow speed. If one can be found.
	else if (movement === "climb") {var baseSpeed = tokenSpeed.find(e => e.id == "climb")?.value} // If movement type is set to climbing, sets base speed to climb speed. If one can be found.
	else if (movement === "swim") {var baseSpeed = tokenSpeed.find(e => e.id == "swim")?.value} // If movement type is set to swimming, sets base speed to swim speed. If one can be found.
	else if (movement === "fly") {var baseSpeed = tokenSpeed.find(e => e.id == "fly")?.value}; // If movement type is set to flying, sets base speed to fly speed. If one can be found.
	if (movement === "default" || baseSpeed === undefined){var baseSpeed = parseFloat(tokenSpeed[0].value); movement = "default"}; // if the movement type was not set to one burrow,climb,swim, or fly. Or if no speed of the requested type exists for that actor, returns the land speed.

	return {speed:baseSpeed, type:movement}

};

//determines how many actions a token should start with.
function actionCount (token){
let numactions = token.actor.data.flags.pf2e?.actions?.numActions ?? 3; //Set the base number of actions to the numActions flag stored in the actor, or the default 3, if that cannot be found.
const conditions = game.pf2e.ConditionManager.getFlattenedConditions(token.actor.data.items.filter(item => item.type === 'condition' && item.flags.pf2e?.condition)); //Gets a read out of the conditions effecting the actor & converts the condition list into a state that's easier to use.

//This loop handles all changes to number of actions from conditions.
for (var i=0, len=conditions.length; i<len; i++) {
	//Interates through the conditions.
	if(conditions[i].name.includes("Quickened") && conditions[i].active === true){
		numactions = numactions + 1;
		// Self explanatory. If a token is quickened increases the number of actions.
	} else if (conditions[i].name.includes("Stunned") && conditions[i].active === true) {
		numactions = numactions - conditions[i].value
		//if you've got the stunned condition reduces the number of actions you can take by your stunned value.
	} else if (conditions[i].name.includes("Slowed") && conditions[i].active === true) {
		numactions = numactions - conditions[i].value
		//if you've got the slowed condition reduces the number of actions you can take by you stunned value. Note: the conditions[i].active === true is important because stunned will override slowed setting it to inactive but the condition and its value still exist.
	}
	else if (conditions[i].name.includes("Immobilized") && conditions[i].active === true) {
		numactions = numactions - numactions
		//if you've got the immobilized condition sets the number of move actions you can take to 0. This also handles restrained as restrained gives a linked immobilized condition.
	}
	else if (conditions[i].name.includes("Paralyzed") && conditions[i].active === true) {
		numactions = numactions - numactions
		//if you've got the paralyzed condition sets the number of move actions you can take to 0.
	}
}

if (numactions < 0) {numactions = 0};
//You can't have less than 0 actions, if you've managed to get to less than 0, due to being stunned 4 for example, set the number of actions you get to take to 0
token.actor.setFlag('pf2e', 'actions.numActions', numactions)
return numactions
};

//This function handles tracking how far a token has moved, allowing for drag ruler to consider movements less than a full movement speed as complete.
function movementTracking (token){
	const distanceMoved = dragRuler.getMovedDistanceFromToken(token); //gets how far the token has moved this round.
	const baseSpeed = movementSpeed(token).speed; //gets the base speed for the token, based on current movement type.
	var usedActions = 0;

//if movement history is enabled, stores how far a token moved as the maximum range for that movement.
if(game.settings.get("drag-ruler", "enableMovementHistory") === true){
	if (distanceMoved > token.actor.data.flags.pf2e?.actions?.action3 && token.actor.data.flags.pf2e?.actions?.action4 === undefined){
		token.actor.setFlag('pf2e', 'actions.action4', Math.min((baseSpeed*4), (token.actor.data.flags.pf2e?.actions?.action3 + baseSpeed), distanceMoved)); //if you moved further than you could have on your third movement action (based on movement history), set your maximum distance as the minimum of your 4* your base speed,
	}
	if (distanceMoved > token.actor.data.flags.pf2e?.actions?.action2 && token.actor.data.flags.pf2e?.actions?.action3 === undefined){
		token.actor.setFlag('pf2e', 'actions.action3', Math.min((baseSpeed*3), (token.actor.data.flags.pf2e?.actions?.action2 + baseSpeed), distanceMoved));
	}
	if (distanceMoved > token.actor.data.flags.pf2e?.actions?.action1 && token.actor.data.flags.pf2e?.actions?.action2 === undefined){
		token.actor.setFlag('pf2e', 'actions.action2', Math.min((baseSpeed*2), (token.actor.data.flags.pf2e?.actions?.action1 + baseSpeed), distanceMoved));
	}
	if (distanceMoved > 0 && token.actor.data.flags.pf2e?.actions?.action1 === undefined) {
		token.actor.setFlag('pf2e', 'actions.action1', (Math.min(baseSpeed, distanceMoved)));
	};

//If movement history is enabled also determines how many actions of movement have been used.
	if (token.actor.data.flags.pf2e?.actions?.action4 !== undefined){var usedActions = 4
	} else if (token.actor.data.flags.pf2e?.actions?.action3 !== undefined) {var usedActions = 3
	} else if (token.actor.data.flags.pf2e?.actions?.action2 !== undefined) {var usedActions = 2
	} else if (token.actor.data.flags.pf2e?.actions?.action1 !== undefined) {var usedActions = 1
	} else {const usedActions = 0};
	//sets the range for each movement as either how far the token moved for that action, or to how far the token moved for the previous action, plus the base speed.
		const A1 = token.actor.data.flags.pf2e?.actions?.action1 || baseSpeed;
		const A2 = (token.actor.data.flags.pf2e?.actions?.action2 || (A1 + baseSpeed)) || baseSpeed*2;
		const A3 = (token.actor.data.flags.pf2e?.actions?.action3 || (A2 + baseSpeed)) || baseSpeed*3;
		const A4 = (token.actor.data.flags.pf2e?.actions?.action4 || (A3 + baseSpeed)) || baseSpeed*4;
		return {A1: A1, A2: A2, A3: A3, A4: A4, usedActions:usedActions}
	} else {
	//if movement history isn't enabled set the range for each movement to just the maximum.
	const A1 =  baseSpeed;
	const A2 = (baseSpeed * 2);
	const A3 = (baseSpeed * 3);
	const A4 = (baseSpeed * 4);
	return {A1: A1, A2: A2, A3: A3, A4: A4, usedActions:usedActions}
	}
}

//handles all the ignore/reduce terrain stuff.
function envReductions (token){
	var reduced = []; //sets up an array.
	const movementType = movementSpeed(token).type; //gets type of movement.
	const tokenElevation = token.data.elevation //gets token elevation.
	var ignoredEnv= Object.keys(token.actor.data.flags.pf2e?.movement?.env?.ignore || {any: false} ).filter(a => token.actor.data.flags.pf2e?.movement?.env?.ignore?.[a]);  //finds all the flags set by effects asking the actor to ignore a type of terrain.
	var reducedEnv= Object.keys(token.actor.data.flags.pf2e?.movement?.env?.reduce || {any: false} ).filter(a => token.actor.data.flags.pf2e?.movement?.env?.reduce?.[a]); //finds all the flags set by effects asking the actor to reduce the cost of a type of terrain.

	//if enhanced terrain layer isn't active, ignore difficult terrain if the token is elevated or flying.
	if (game.modules.get("enhanced-terrain-layer")?.active === false && game.settings.get("pf2e-dragruler", "auto") && (tokenElevation !== 0 || movementType === 'fly' === true)) {reduced = "ignore"};
	// if enhanced terrain layer isn't active and the cost of all terrain should be reduced, set output appropriately.
	if (game.modules.get("enhanced-terrain-layer")?.active === false && token.actor.data.flags.pf2e?.movement?.reduceTerrain === true) {reduced = "reduce"};
	// if an actor is set to ignore all difficult terrain set to output appropriately
	if(token.actor.data.flags.pf2e?.movement?.ignoreTerrain|| token.actor.data.flags.pf2e?.movement?.climbing){reduced = "ignore"};
	// if an actor is set to respect all difficult terrain regardless of other settings, set the output appropriately.
	if(token.actor.data.flags.pf2e?.movement?.respectTerrain|| token.actor.data.flags.pf2e?.movement?.climbing){reduced = "respect"};

	//if you are using enhanced terrain layer get the list of obstacles and environments.
	if (game.modules.get("enhanced-terrain-layer")?.active){
		const terrainlist = canvas.terrain.getEnvironments().map(a => a.id);
		//const terrainList = canvas.terrain.getObstacles().map(a => a.id);
		//terrainList.concat(canvas.terrain.getEnvironments().map(a => a.id));
	// So long as reduced hasn't been set to a string by one of the above if statements, proceed to set the cost of terrain
	if (reduced.length === 0){
		if (token.actor.data.flags.pf2e?.movement?.reduceTerrain === true) {reducedEnv = terrainList}; // If the reduce all flag is raised, set reduce for all environements and obstacles
		if(reducedEnv?.find(e => e == 'non-magical')){ if(reducedEnv?.find(e => e == 'magical')) {reducedEnv = terrainList} else{reducedEnv = terrainList.filter(a => a !== 'magical')}}; // Lets the flag, non-magical reduce all the cost of all non-magical difficult terrain.
		for (var i=0, len=reducedEnv?.length||0; i<len; i++){
			reduced.push({id:reducedEnv[i], value:'-1'}) // sets the value for each of the environments that should have their cost reduced to '-1', which tells enhanced terrain layer to drop their cost by 1.
		};

		if (ignoredEnv?.find(e => e == 'non-magical')){ if(ignoredEnv?.find(e => e == 'magical')) {ignoredEnv = terrainList} else{ignoredEnv = terrainList.filter(a => a !== 'magical')}}; // Lets the flag, non-magical ignore all the cost of all non-magical difficult terrain.
		if (movementType === 'burrow') {ignoredEnv = terrainList.filter(a => a !== 'underground')}; //ignore the difficult of underground terrain if you are using a burrow speed.
		if (movementType === 'swim' && reduced.find(e => e.id == "water")){reduced.find(e => e.id == "water").value = 1} else if (movementType === 'swim'){reduced.push({id:'water', value:1})}; //ignore the difficulty of water if using a swim speed.
		for (var i=0, len=ignoredEnv?.length||0; i<len; i++){
			if (reduced.find(e => e.id == ignoredEnv[i])){reduced.find(e => e.id == ignoredEnv[i]).value = 1 //tells enhanced terrain layer to update treat the cost of moving to squares with ignored difficult terrain to 1. (For if the value was already set during the reduce step)
			} else {reduced.push({id:ignoredEnv[i], value:1})}; // if the environment/obstacle in question hasn't been added to the reduce function yet add it and sets the value to move to those squares to 1.
		};
	 };
 };
	return reduced
};
