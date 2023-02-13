function movementSpeed(token, type) {
	//handles speeds for non vehicles
	if (token.actor.type === "character" && type === 'land'){type = 'land-speed'}
	if (token.actor.type !== "vehicle"){
    let findSpeed = token?.actor?.system?.attributes?.speed?.otherSpeeds.find(e => e.type == type) ?? 0;
		if(findSpeed?.total !== undefined){
			return {speed: findSpeed?.total > 0 ? findSpeed?.total : parseFloat(findSpeed?.breakdown?.match(/\d+(\.\d+)?/)[0]), type: type} //if a matching speed if found returns it.
                } else if (token.actor.system.attributes?.speed?.total !== 0 && isNaN(token.actor.system.attributes?.speed?.total) == false){
			//If the speed in question wasn't found above, and the speed total isn't 0 (happens to some npcs who's speed is stored in value instead) returns the speed total. And the type, for NPCs that may be set as something other than land.
			return {speed: parseFloat(token.actor.system.attributes?.speed?.total) ??  0, type: token.actor.system.attributes?.speed?.type ?? 'default' }
		}	else {
			return {speed:Math.max([parseFloat(token.actor.system.attributes?.speed?.breakdown?.match(/\d+(\.\d+)?/)[0]), parseFloat(token.actor.system.attributes?.speed?.otherSpeeds[0]?.total), 0].filter(Number)), type: 'special' } //pulls out the speed for the value string in the event that the total was 0. In the event that both the total and value for the land speed are 0, falls back on the first other speed total, should one not exist speed will be 0.
		};
		//handles speeds for vehicles because they're different.
	} else if (token.actor.type === "vehicle"){
		return {speed:parseFloat(token.actor.system.details?.speed), type: 'default'}
	}
};

//This function handles determining the type of movment.
function getMovementType(token){
  const tokenElevation = token?.document?.elevation; //Gives us a way to check if a token is flying
	var movementType = 'land';
  //This logic gate handles flight, burrowing and swimming, if the automatic movment switching is on.
  if (game.settings.get("pf2e-dragruler", "auto")) {
  	if(tokenElevation > 0) {var movementType = 'fly'}; //if elevated fly
  	if (tokenElevation < 0){var movementType = 'burrow'}; //if below ground burrow.
		if (game.modules.get("enhanced-terrain-layer")?.active){
			const tokenPosition = [token.document.x, token.document.y];
			if(canvas.terrain.terrainFromPixels(tokenPosition[0],tokenPosition[1])[0]?.document?.environment === 'aquatic' || canvas.terrain.terrainFromPixels(tokenPosition[0],tokenPosition[1])[0]?.document?.environment === 'water'|| canvas.terrain.terrainFromPixels(tokenPosition[0],tokenPosition[1])[0]?.document?.obstacle === 'water'){var movementType = 'swim'}
		} //switches to swim speed, if the token starts the movement in water or aquatic terrain.
	};

	//This logic gate handles flight and swimming, if the scene environment based movement switching is on.
	if (game.settings.get("pf2e-dragruler", "scene") === true && game.modules.get("enhanced-terrain-layer")?.active) {
		if(canvas.scene.getFlag('enhanced-terrain-layer', 'environment') === 'sky') {var movementType = 'fly'}; //checks if the scene is set to have a default environment of sky. If so, uses fly speed.
		if(canvas.scene.getFlag('enhanced-terrain-layer', 'environment') === 'aquatic'){var movementType = 'swim'}; //checks if the scene is set to have a default environment of aquatic. If so, uses swim speed.
	};

  if(token.actor.flags.pf2e?.movement?.burrowing === true){var movementType = 'burrow'} //switches to burrowing if the burrow effect is applied to the actor.
  if(token.actor.flags.pf2e?.movement?.climbing === true){var movementType = 'climb'} //switches to climbing if the climb effect is applied to the actor.
  if(token.actor.flags.pf2e?.movement?.swimming === true){var movementType = 'swim'} //switches to swimming if the swim effect is applied to the actor.
  if(token.actor.flags.pf2e?.movement?.flying === true){var movementType = 'fly'} //switches to flying if the fly effect is applied to the actor.
  if(token.actor.flags.pf2e?.movement?.walking === true){var movementType = 'land'}

return movementType;
}

function conditionFacts (tokenConditions, conditionSlug) {
	let condition = tokenConditions.find(e => e.slug == conditionSlug)
	return {condition:condition?.slug, active:condition?.isActive, value: condition?.value  }
}

//determines how many actions a token should start with.
export function actionCount (token){
let numactions = 3 //Set the base number of actions to the default 3.
const conditions = token.actor.items.filter(item => item.type === 'condition')
const stunned = conditionFacts(conditions, "stunned");
const slowed = conditionFacts(conditions, "slowed");

if(conditionFacts(conditions, "quickened").active){
		numactions = numactions + 1};
		// Self explanatory. If a token is quickened increases the number of actions.}
if (slowed.active || stunned.active) {
		numactions = numactions - Math.max ((slowed.value ?? 0), (stunned.value ?? 0))}
		//if you've got the stunned or slowed condition reduces the number of actions you can take by the larger of the two values, since stunned overrides slowed, but actions lost to stunned count towards the slowed count.
if (conditionFacts(conditions, "immobilized").active || conditionFacts(conditions, "paralyzed").active || conditionFacts(conditions, "petrified").active || conditionFacts(conditions, "unconscious").active) {
		numactions = 0
		//if you've got the immobilized, paralyzed or petrified  condition sets the number of move actions you can take to 0. This also handles restrained as restrained gives a linked immobilized condition.
	}
if (numactions < 0) {numactions = 0};
//You can't have less than 0 actions, if you've managed to get to less than 0, due to being stunned 4 for example, set the number of actions you get to take to 0
return numactions
};

//This function handles tracking how far a token has moved, allowing for drag ruler to consider movements less than a full movement speed as complete.
export function movementTracking (token){
  const movementType = getMovementType(token);
	const baseSpeed = movementSpeed(token, movementType).speed; //gets the base speed for the token, based on current movement type.
	var usedActions = 0;
  	//sets the range for each movement as either how far the token moved for that action, or to how far the token moved for the previous action, plus the base speed.
  		var A1 = baseSpeed;
  		var A2 = baseSpeed*2;
  		var A3 = baseSpeed*3;
  		var A4 = baseSpeed*4;
	return {A1: A1, A2: A2, A3: A3, A4: A4, usedActions:usedActions, type:movementType}
};
