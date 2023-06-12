export function registerSettings() {
	// Create the setting for Automatic Movement switching for later use.
game.settings.register("pf2e-dragruler", "auto", {
		name: game.i18n.localize("pf2e-dragruler.settings.auto.name"),
		hint: game.i18n.localize("pf2e-dragruler.settings.auto.hint"),
		scope: "world",
		config: true,
		type: Boolean,
		default: false
}),
game.settings.register("pf2e-dragruler", "scene", {
	name: game.i18n.localize("pf2e-dragruler.settings.scene.name"),
	hint: game.i18n.localize("pf2e-dragruler.settings.scene.hint"),
	scope: "world",
	config: true,
	type: Boolean,
	default: false
}),
game.settings.register("pf2e-dragruler", "offTurnMovement", {
	name: game.i18n.localize("pf2e-dragruler.settings.offTurnMovement.name"),
	hint: game.i18n.localize("pf2e-dragruler.settings.offTurnMovement.hint"),
	scope: "world",
	config: true,
	type: Boolean,
	default: false
}),
game.settings.register("pf2e-dragruler", "partialMovements", {
	name: game.i18n.localize("pf2e-dragruler.settings.partialMovements.name"),
	hint: game.i18n.localize("pf2e-dragruler.settings.partialMovements.hint"),
	scope: "world",
	config: true,
	type: Boolean,
	default: false
})
};
