Hooks.once("dragRuler.ready", (SpeedProvider) => {
	class PF2ESpeedProvider extends SpeedProvider {
		get colors() {
			return [
				{id: "FirstAction", default: 0x3222C7},
				{id: "SecondAction", default: 0xFFEC07},
				{id: "ThirdAction", default: 0xC033E0},
				{id: "FourthAction", default: 0x1BCAD8}
			]
		}
		getRanges(token){
			const tokenSpeed = cleanSpeed(token);
			const tokenElevation = token.data.elevation;
			const type = token.actor.data.type;
			const items = token.actor.data.items.filter(item => item.type === 'condition' && item.flags.pf2e?.condition);
			const conditions = PF2eConditionManager.getFlattenedConditions(items);
			let numactions = 3;

			if(tokenElevation > 0) {
				for(var i=0, len= tokenSpeed.length; i<len; i++){
					if (tokenSpeed[i].id === 'fly') {var baseSpeed = parseFloat(tokenSpeed[i].value)}
			 	}
				if (baseSpeed === undefined) {var baseSpeed = parseFloat(tokenSpeed[0].value)}
			}else if (tokenElevation <= 0){var baseSpeed = parseFloat(tokenSpeed[0].value)}


			for (var i=0, len=conditions.length; i<len; i++) {
				if(conditions[i].name.includes("Quickened") && conditions[i].active === true){
					numactions = 4;
					//const quickenedvel = conditions[i].name
				} else if (conditions[i].name.includes("Stunned") && conditions[i].active === true) {
					numactions = numactions - conditions[i].value
				} else if (conditions[i].name.includes("Slowed") && conditions[i].active === true) {
					numactions = numactions - conditions[i].value
				}
			}

			if (numactions < 0) {numactions = 0};
			//window.vel3 = numactions

			if (numactions === 0){baseSpeed = 5};
				const ranges = [{range: baseSpeed, color: "FirstAction"},{range: baseSpeed * 2, color: "SecondAction"}, { range: baseSpeed * 3, color: "ThirdAction" },{range: baseSpeed * 4, color: "FourthAction"}];
				for (var i = numactions, len=ranges.length; i<len; i++){
					 ranges.pop();
					};
			if (numactions === 0){
					baseSpeed = 0;
					ranges.push({range: baseSpeed, color: "FirstAction"});
				};
					return ranges;
			}
		}

	dragRuler.registerModule("pf2e-dragruler", PF2ESpeedProvider)
})

function cleanSpeed(token) {
var land = 0; var fly = 0; var swim = 0; var climb = 0; var burrow = 0; var miscSpeed =0;
	if (token.actor.data.type === "character"){
		const cleanedSpeeds = speedsSorter(token)
		var land = cleanedSpeeds.land; var fly = cleanedSpeeds.fly; var swim = cleanedSpeeds.swim; var climb = cleanedSpeeds.swim; var burrow = cleanedSpeeds.burrow; var miscSpeed =cleanedSpeeds.misc;
		var land = parseFloat(token.actor.data.data.attributes.speed.total);

	} else if (token.actor.data.type === "npc"){
		const cleanedSpeeds = speedsSorter(token)
		var land = cleanedSpeeds.land; var fly = cleanedSpeeds.fly; var swim = cleanedSpeeds.swim; var climb = cleanedSpeeds.swim; var burrow = cleanedSpeeds.burrow; var miscSpeed =cleanedSpeeds.misc;
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

		if (land === 0 && token.actor.data.data.attributes.speed.value !== undefined) {
		var miscSpeed = 0;
			if (token.actor.data.data.attributes.speed.value !== null && token.actor.data.data.attributes.speed.value !== undefined){
				var miscSpeed = parseFloat(token.actor.data.data.attributes.speed.value.match(/\d+/));
			}
		};

	} else if (token.actor.data.type === "familiar"){

		const cleanedSpeeds = speedsSorter(token)
		//window.vel2 = cleanedSpeeds
		var land = cleanedSpeeds.land; var fly = cleanedSpeeds.fly; var swim = cleanedSpeeds.swim; var climb = cleanedSpeeds.swim; var burrow = cleanedSpeeds.burrow; var miscSpeed =cleanedSpeeds.misc;


	} else if (token.actor.data.type === "vehicle"){
		var land = parseFloat(token.actor.data.data.details.speed)
	}

	const speeds = [];
	if (land > 0) {speeds.push({id: "land", value: land})};
	if (fly > 0) {speeds.push({id: "fly", value: fly})};
	if (miscSpeed > 0) {speeds.push({id: "misc", value: miscSpeed})};
	if (swim > 0) {speeds.push({id: "swim", value: swim})};
	if (burrow > 0) {speeds.push({id: "burrow", value: burrow})};
	if (climb > 0) {speeds.push({id: "climb", value: climb})};
	if (speeds.length === 0) {speeds.push({id: "land", value: 0})};

	return speeds
}

function speedsSorter (token) {
var land2 = 0; var fly2 = 0; var swim2 = 0; var climb2 = 0; var burrow2 = 0; var miscSpeed2 =0;
if (token.actor.data.data.attributes.speed.otherSpeeds !== undefined){
	for (var i=0, len=token.actor.data.data.attributes.speed.otherSpeeds.length; i<len; i++){
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

}
