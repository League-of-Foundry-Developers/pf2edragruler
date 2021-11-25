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
	hint: "Requires Enhanced Terrain Layer. If enabled, actors in Sky scenes will automatically use fly speed, and those in aquatic terrain will use swim speeds, if an actor does not have a speed, will use their land speed.",
	scope: "world",
	config: true,
	type: Boolean,
	default: false
}),
game.settings.register("pf2e-dragruler", "version", {
	name: "Version",
	scope: "world",
	config: false,
	type: Number,
	default: 0.46
})
};

Hooks.once("init", () => {
	//Wait until the game is initialized, then register the settings created previously.
	registerSettings();
});

Hooks.once("ready", () => {
if(game.user.isGM === true){
 if (game.settings.get("pf2e-dragruler", "version") < 0.47){
	ui.notifications.info(`Applying Migration for PF2e Drag Ruler Integration. Please be patient and do not close your game or shut down your server.`);
	upgradeActors();
 };
};
});

Hooks.once("canvasInit", () => {
	//When the canvas intializes the first time after a reload, if enhanced terrain layer is active, overwrite the original environment/obstacle lists with a PF2e specific list.
 if (game.modules.get("enhanced-terrain-layer")?.active){
	canvas.terrain.getEnvironments = function(){return [
		{ id: 'aquatic', text: 'Aquatic', icon:'systems/pf2e/icons/spells/crashing-wave.webp'},
		{ id: 'arctic', text: 'Arctic', icon:'systems/pf2e/icons/spells/warped-terrain.webp' },
		{ id: 'coast', text: 'Coast', icon:'systems/pf2e/icons/features/ancestry/skilled-heritage.webp' },
		{ id: 'desert', text: 'Desert', icon:'systems/pf2e/icons/spells/dust-storm.webp' },
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
			 var calcCost = costs.reduce((max, current) => Math.max(max, current));
			 if(token.actor.data.flags.pf2e?.movement?.increaseTerrain === true){calcCost +=1};
		 } else {
			 //method for calculating difficult terrain if the old terrain layer module is in use.
				const costs = area.map(space => canvas.terrain.costGrid[space.y]?.[space.x]?.multiple ?? 1);
				var calcCost = costs.reduce((max, current) => Math.max(max, current));
			 }
			 if (reduced === "reduce" && calcCost > 1) {calcCost -= 1} //If the token is set to reduce the cost of all difficult terrain, reduce the calculated costs. For enhanced terrain ruler this is handled by envReductions
			 return calcCost;
		 }
	};
};
	dragRuler.registerModule("pf2e-dragruler", PF2ESpeedProvider) //register the speed provider so its selectable from the drag ruler configuration.
});

function cleanSpeed(token, type) {
	//handles speeds for non vehicles
	if (token.actor.data.type === "character" && type === 'land'){type = 'land-speed'}
	if (token.actor.data.type !== "vehicle"){
		for (var i=0, len=token.actor.data.data.attributes.speed?.otherSpeeds.length; i<len; i++){
			//iterates through other speeds, if they exist to find the speed that matches our movement type.
			if(token.actor.data.data.attributes.speed.otherSpeeds[i].type.toLowerCase() === type && token.actor.data.data.attributes.speed.otherSpeeds[i].total !== undefined){
				return {baseSpeed: token.actor.data.data.attributes.speed.otherSpeeds[i].total > 0 ? token.actor.data.data.attributes.speed.otherSpeeds[i].total : parseFloat(token.actor.data.data.attributes?.speed?.otherSpeeds[i].value?.match(/\d+(\.\d+)?/)), type: type} //if a matching speed if found returns it.
			}
		}
		if(token.actor.data.data.attributes?.speed?.total !== 0 && token.actor.data.data.attributes?.speed?.total !== undefined){
			//If the speed in question wasn't found above, and the speed total isn't 0 (happens to some npcs who's speed is stored in value instead) returns the speed total. And the type, for NPCs that may be set as something other than land.
			return {baseSpeed: parseFloat(token.actor.data.data.attributes?.speed?.total) ??  0, type: token.actor.data.data.attributes?.speed?.type ?? 'default' }
		}	else {
			return {baseSpeed:parseFloat(token.actor.data.data.attributes?.speed?.value?.match(/\d+(\.\d+)?/)) ?? 0, type: 'special' } //pulls out the speed for the value string in the event that the total was 0.
		};
		//handles speeds for vehicles because they're different.
	} else if (token.actor.data.type === "vehicle"){
		return {baseSpeed:parseFloat(token.actor.data.data.details?.speed), type: 'default'}
	}
};

//This function handles determining the type of movment. And requests the matching speed.
function movementSpeed (token) {
	const tokenElevation = token.data.elevation; //Gives us a way to check if a token is flying
	var movementType = 'land';

//This logic gate handles flight and swimming, if the scene environment based movement switching is on.
if (game.settings.get("pf2e-dragruler", "scene") === true && game.modules.get("enhanced-terrain-layer")?.active) {
	if(canvas.scene.getFlag('enhanced-terrain-layer', 'environment') === 'sky') {var movementType = 'fly'}; //checks if the scene is set to have a default environment of sky. If so, uses fly speed.
	if(canvas.scene.getFlag('enhanced-terrain-layer', 'environment') === 'aquatic'){var movementType = 'swim'}; //checks if the scene is set to have a default environment of aquatic. If so, uses swim speed.
};

//This logic gate handles flight, burrowing and swimming, if the automatic movment switching is on.
if (game.settings.get("pf2e-dragruler", "auto")=== true) {
	if(tokenElevation > 0) {var movementType = 'fly'}; //if elevated fly
	if (tokenElevation < 0){var movementType = 'burrow'}; //if below ground burrow.
		if (game.modules.get("enhanced-terrain-layer")?.active){
		const tokenPosition = canvas.grid.grid.getGridPositionFromPixels(token.data.x, token.data.y);
		if(canvas.terrain.terrainFromGrid(tokenPosition[1], tokenPosition[0])[0]?.environment?.id === 'aquatic' || canvas.terrain.terrainFromGrid(tokenPosition[1], tokenPosition[0])[0]?.environment?.id === 'water'){var movementType = 'swim'}}; //switches to swim speed, if the token starts the movement in water or aquatic terrain.
};

if(token.actor.data.flags.pf2e?.movement?.burrowing === true){var movementType = 'burrow'} //switches to burrowing if the burrow effect is applied to the actor.
if(token.actor.data.flags.pf2e?.movement?.climbing === true){var movementType = 'climb'} //switches to climbing if the climb effect is applied to the actor.
if(token.actor.data.flags.pf2e?.movement?.swimming === true){var movementType = 'swim'} //switches to swimming if the swim effect is applied to the actor.
if(token.actor.data.flags.pf2e?.movement?.flying === true){var movementType = 'fly'} //switches to flying if the fly effect is applied to the actor.

const tokenSpeed = cleanSpeed(token, movementType);
return {speed:tokenSpeed.baseSpeed, type: tokenSpeed.type}
};

//determines how many actions a token should start with.
function actionCount (token){
let numactions = 3 //Set the base number of actions to the default 3.
//const conditions = game.pf2e.ConditionManager.getFlattenedConditions(token.actor.data.items.filter(item => item.type === 'condition' && item.flags.pf2e?.condition)); //Gets a read out of the conditions effecting the actor & converts the condition list into a state that's easier to use.
const conditions = token.actor.data.items.filter(item => item.type === 'condition')
//This loop handles all changes to number of actions from conditions.
for (var i=0, len=conditions.length; i<len; i++) {
	//Interates through the conditions.
	if(conditions[i].name.includes("Quickened") && conditions[i].isActive === true){
		if(numactions !== 0) {numactions = numactions + 1};
		// Self explanatory. If a token is quickened increases the number of actions.
	} else if (conditions[i].name.includes("Stunned") && conditions[i].isActive === true) {
		numactions = numactions - conditions[i].value
		//if you've got the stunned condition reduces the number of actions you can take by your stunned value.
	} else if (conditions[i].name.includes("Slowed") && conditions[i].isActive === true) {
		numactions = numactions - conditions[i].value
		//if you've got the slowed condition reduces the number of actions you can take by you stunned value. Note: the conditions[i].active === true is important because stunned will override slowed setting it to inactive but the condition and its value still exist.
	}
	else if (conditions[i].name.includes("Immobilized") && conditions[i].isActive === true) {
		numactions = 0
		//if you've got the immobilized condition sets the number of move actions you can take to 0. This also handles restrained as restrained gives a linked immobilized condition.
	}
	else if (conditions[i].name.includes("Paralyzed") && conditions[i].isActive === true) {
		numactions = 0
		//if you've got the paralyzed condition sets the number of move actions you can take to 0.
	}
}
if (numactions < 0) {numactions = 0};
//You can't have less than 0 actions, if you've managed to get to less than 0, due to being stunned 4 for example, set the number of actions you get to take to 0
return numactions
};

//This function handles tracking how far a token has moved, allowing for drag ruler to consider movements less than a full movement speed as complete.
function movementTracking (token){
	const baseSpeed = movementSpeed(token).speed; //gets the base speed for the token, based on current movement type.
	var usedActions = 0;

	//if movement history isn't enabled set the range for each movement to just the maximum.
	const A1 =  baseSpeed;
	const A2 = (baseSpeed * 2);
	const A3 = (baseSpeed * 3);
	const A4 = (baseSpeed * 4);
	return {A1: A1, A2: A2, A3: A3, A4: A4, usedActions:usedActions}
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
	if(token.actor.data.flags.pf2e?.movement?.respectTerrain){reduced = "respect"};

	//if you are using enhanced terrain layer get the list of obstacles and environments.
	if (game.modules.get("enhanced-terrain-layer")?.active){
		const terrainList = canvas.terrain.getEnvironments().map(a => a.id);

	// So long as reduced hasn't been set to a string by one of the above if statements, proceed to set the cost of terrain
	if (reduced.length === 0){
		if (token.actor.data.flags.pf2e?.movement?.reduceTerrain === true) {reducedEnv = terrainList}; // If the reduce all flag is raised, set reduce for all environements and obstacles
		for (var i=0, len=reducedEnv?.length||0; i<len; i++){
			reduced.push({id:reducedEnv[i], value:'-1'}) // sets the value for each of the environments that should have their cost reduced to '-1', which tells enhanced terrain layer to drop their cost by 1.
		};
		if(reducedEnv?.find(e => e == 'non-magical')){reduced = [{id: 'magical', value:'+0'},{value:'-1', stop:1}]}; // Lets the flag, non-magical reduce all the cost of all non-magical difficult terrain.

		if (movementType === 'burrow') {ignoredEnv = terrainList.filter(a => a !== 'underground')}; //ignore the difficult of underground terrain if you are using a burrow speed.
		if (movementType === 'swim' && reduced.find(e => e.id == "water")){reduced.find(e => e.id == "water").value = 1} else if (movementType === 'swim'){reduced.push({id:'water', value:1})}; //ignore the difficulty of water if using a swim speed.
		for (var i=0, len=ignoredEnv?.length||0; i<len; i++){
			if (reduced.find(e => e.id == ignoredEnv[i])){reduced.find(e => e.id == ignoredEnv[i]).value = 1 //tells enhanced terrain layer to update treat the cost of moving to squares with ignored difficult terrain to 1. (For if the value was already set during the reduce step)
			} else {reduced.push({id:ignoredEnv[i], value:1})}; // if the environment/obstacle in question hasn't been added to the reduce function yet add it and sets the value to move to those squares to 1.
		};
		if(ignoredEnv?.find(e => e == 'non-magical')){reduced = [{id: 'magical', value:'+0'},{value:'-4', stop:1}]}; // Lets the flag, non-magical ignore all the cost of all non-magical difficult terrain.
	 };
 };
 window.vel = reduced;
	return reduced
};

async function upgradeActors() {
	for (const actor of game.actors.entities) {
     actor.unsetFlag('pf2e', 'actions');
	};
	game.settings.set("pf2e-dragruler", "version", 0.47), ui.notifications.info(`PF2E-Drag Ruler Integration upgrade to version 0.4.7 completed!`)
};
