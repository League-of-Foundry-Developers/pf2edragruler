Hooks.once("dragRuler.ready", () => {
	dragRuler.registerModule("pf2e-bleedingsky-data", speedProvider)
})

const speedProvider = function mySpeedProvider(token, playerColor) {
const type = token.actor.data.type;
const items = token.actor.data.items.filter(item => item.type === 'condition' && item.flags.pf2e?.condition);
window.itemsVEL = items;
const conditions = PF2eConditionManager.getFlattenedConditions(items);
window.conditionsVEL = PF2eConditionManager.getFlattenedConditions(items);
window.INCLUSION = conditions[0].id
let numactions = 3;
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

if (type === "character") {
		var baseSpeed = token.actor.data.data.attributes.speed.total;
		if (numactions === 0){baseSpeed = 5};
		const ranges = [{range: baseSpeed, color: playerColor},{range: baseSpeed * 2, color: 0xFFFF00}, { range: baseSpeed * 3, color: 0xff8000 },{range: baseSpeed * 4, color: 0x008080}];
		for (var i = numactions, len=ranges.length; i<len; i++){
			ranges.pop();
		};
		if (numactions === 0){
			baseSpeed = 0;
			ranges.push({range: baseSpeed, color: playerColor});
		};
		return ranges;

	} else {
		const baseSpeed = token.actor.data.data.attributes.speed.value;
		return [
			{ range: baseSpeed, color: playerColor },
			{ range: baseSpeed * 2, color: 0xffff00 },
			{ range: baseSpeed * 3, color: 0xff8000 },
		];
	}
}
