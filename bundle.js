function registerSettings() {
	game.settings.register("pf2e-dragruler", "auto", {
		name: "Automatic Movement Switching",
		hint: "If enabled, positive elevations will automatically use fly speed, negative elevations will use burrow, and tokens in water, or aquatic terrain will use swim speeds, if an actor does not have that speed, will use their land speed.",
		scope: "world",
		config: true,
		type: Boolean,
		default: false
})
};

Hooks.once("init", () => {
	registerSettings();
});

Hooks.once("ready", () => {
 if (game.modules.get("enhanced-terrain-layer")?.active){
	canvas.terrain.getEnvironments = function(){return [
		{ id: 'aquatic', text: 'Aquatic' },
		{ id: 'arctic', text: 'Arctic' },
		{ id: 'coast', text: 'Coast' },
		{ id: 'desert', text: 'Desert' },
		{ id: 'forest', text: 'Forest' },
		{ id: 'mountain', text: 'Mountain' },
		{ id: 'plains', text: 'Plains' },
		{ id: 'sky', text: 'Sky' },
		{ id: 'swamp', text: 'Swamp' },
		{ id: 'underground', text: 'Underground' },
		{ id: 'urban', text: 'Urban' }];
	},
	canvas.terrain.getObstacles = function(){return [
		{ id: 'current', text: 'Current' },
		{ id: 'crowd', text: 'Crowd' },
		{ id: 'ice', text: 'Ice' },
		{ id: 'magical', text: 'Magical' },
		{ id: 'plants', text: 'Plants' },
		{ id: 'rubble', text: 'Rubble' },
		{ id: 'water', text: 'Water' },
		{ id: 'wind', text: 'Wind' }];
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
			var baseSpeed = movementSpeed(token);
			var numactions = actionCount(token);
			const ranges = [];

		if (numactions > 0 && baseSpeed > 0){
			//Set the ranges for each of our four actions to be given to the drag ruler.
			ranges.push({range: baseSpeed, color: "FirstAction"},{range: baseSpeed * 2, color: "SecondAction"}, { range: baseSpeed * 3, color: "ThirdAction" },{range: baseSpeed * 4, color: "FourthAction"});
			//Remove ranges from the function until only the ranges equal to the number of legal actions remain.
			 for (var i = numactions, len=ranges.length; i<len; i++){
				ranges.pop();
			 };
		 } else {ranges.push({range: 0, color: "FirstAction"})}; //Since ranges is empty if you've got no actions add a range for the first action of 0.

			return ranges;
		};

		getCostForStep(token, area){
			var reduced = envReductions(token);
			if(token.actor.data.flags.pf2e?.movement?.flying === true && token.data.elevation <= 0){var tokenElevation = 1} else if(reduced === "respect"){var tokenElevation = undefined} else {var tokenElevation = token.data.elevation};
			// Lookup the cost for each square occupied by the token

			if (reduced === "ignore"){ return 1 } else {
					if (game.modules.get("enhanced-terrain-layer")?.active === true){
					 if (reduced === "respect"){ reduced = [];}
					 const costs = area.map(space => canvas.terrain.cost([space],{tokenId:token.data._id, elevation:tokenElevation, reduce:reduced})); //
				 // Return the maximum of the costs
					 var calcCost = costs.reduce((max, current) => Math.max(max, current))
				 } else {
					 	const costs = area.map(space => canvas.terrain.costGrid[space.y]?.[space.x]?.multiple ?? 1);
					 	var calcCost = costs.reduce((max, current) => Math.max(max, current));
					 }
					 if (reduced === "reduce" && calcCost > 1) {calcCost -= 1}
					 return calcCost;
				 }

			}

	}

	dragRuler.registerModule("pf2e-dragruler", PF2ESpeedProvider) //register the speed provider so its selectable from the drag ruler configuration.
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
				var miscSpeed = parseFloat(token.actor.data.data.attributes.speed.value.match(/\d+/)); //in the event we really do have a speed in .value that didn't make it to .total, covert it to a number, and assign it. If the conditions above are both false, speed will be treated as 0, the fallback from above.
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

function movementSelect (token) {
	const tokenElevation = token.data.elevation; //Gives us a way to check if a token is flying
	var movementType = 'default';

//This logic gate handles flight and burrowing, if the elevation setting is on.
if (game.settings.get("pf2e-dragruler", "auto")=== true) {
	if(tokenElevation > 0) {var movementType = 'fly'};
	if (tokenElevation < 0){var movementType = 'burrow'};
	if (game.modules.get("enhanced-terrain-layer")?.active){if(canvas.terrain.terrainAt(token.data.x/100,token.data.y/100)[0]?.environment === 'aquatic' || canvas.terrain.terrainAt(token.data.x/100,token.data.y/100)[0]?.environment === 'water'){var movementType = 'swim'}};
};
if(token.actor.data.flags.pf2e?.movement?.burrowing === true){var movementType = 'burrow'}
if(token.actor.data.flags.pf2e?.movement?.climbing === true){var movementType = 'climb'}
if(token.actor.data.flags.pf2e?.movement?.swimming === true){var movementType = 'swim'}
if(token.actor.data.flags.pf2e?.movement?.flying === true){var movementType = 'fly'}

return movementType
};

function movementSpeed (token) {
	const tokenSpeed = cleanSpeed(token); //This does most of the heavy lifting.
	const movement = movementSelect(token);

	 //Sets base speed to the default value.
	if (movement === "burrow") {var baseSpeed = tokenSpeed.find(e => e.id == "burrow")?.value} // If movement type is set to burrowing, sets base speed to burrow speed. If one can be found.
	else if (movement === "climb") {var baseSpeed = tokenSpeed.find(e => e.id == "climb")?.value}
	else if (movement === "swim") {var baseSpeed = tokenSpeed.find(e => e.id == "swim")?.value}
	else if (movement === "fly") {var baseSpeed = tokenSpeed.find(e => e.id == "fly")?.value};
	if (movement === "default" || baseSpeed === undefined){var baseSpeed = parseFloat(tokenSpeed[0].value)};

	return baseSpeed

};

function actionCount (token){
let numactions = 3; //Sets the default number of actions (3) which can then be modified depending on the conditions.
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
return numactions
};

function envReductions (token){
	var reduced = [];
	const movementType = movementSelect(token);
	const tokenElevation = token.data.elevation
	var ignoredEnv= Object.keys(token.actor.data.flags.pf2e?.movement?.env?.ignore || {any: false} ).filter(a => token.actor.data.flags.pf2e?.movement?.env?.ignore?.[a]);
	var reducedEnv= Object.keys(token.actor.data.flags.pf2e?.movement?.env?.reduce || {any: false} ).filter(a => token.actor.data.flags.pf2e?.movement?.env?.reduce?.[a]);


	if (game.modules.get("enhanced-terrain-layer")?.active === false && game.settings.get("pf2e-dragruler", "auto") && (tokenElevation !== 0 || movementType === 'fly' === true)) {reduced = "ignore"};
	if (game.modules.get("enhanced-terrain-layer")?.active === false && token.actor.data.flags.pf2e?.movement?.reduceTerrain === true) {reduced = "reduce"};
	if(token.actor.data.flags.pf2e?.movement?.ignoreTerrain|| token.actor.data.flags.pf2e?.movement?.climbing){reduced = "ignore"};
	if(token.actor.data.flags.pf2e?.movement?.respectTerrain|| token.actor.data.flags.pf2e?.movement?.climbing){reduced = "respect"};

	if (game.modules.get("enhanced-terrain-layer")?.active){
		const terrainList = canvas.terrain.getObstacles().map(a => a.id);
		terrainList.concat(canvas.terrain.getEnvironments().map(a => a.id));
	if (reduced.length === 0){
		if (token.actor.data.flags.pf2e?.movement?.reduceTerrain === true) {reducedEnv = terrainList};
		if(reducedEnv?.find(e => e == 'non-magical')){ if(reducedEnv?.find(e => e == 'magical')) {reducedEnv = terrainList} else{reducedEnv = terrainList.filter(a => a !== 'magical')}};
		for (var i=0, len=reducedEnv?.length||0; i<len; i++){
			reduced.push({id:reducedEnv[i], value:'-1'})
		};

		if (ignoredEnv?.find(e => e == 'non-magical')){ if(ignoredEnv?.find(e => e == 'magical')) {ignoredEnv = terrainList} else{ignoredEnv = terrainList.filter(a => a !== 'magical')}};
		if (movementType === 'burrow') {ignoredEnv = terrainList.filter(a => a !== 'underground')};
		if (movementType === 'swim' && reduced.find(e => e.id == "water")){reduced.find(e => e.id == "water").value = 1} else if (movementType === 'swim'){reduced.push({id:'water', value:1})};
		for (var i=0, len=ignoredEnv?.length||0; i<len; i++){
			if (reduced.find(e => e.id == ignoredEnv[i])){reduced.find(e => e.id == ignoredEnv[i]).value = 1
			} else {reduced.push({id:ignoredEnv[i], value:1})};
		};
	 };
 };
	return reduced
};
