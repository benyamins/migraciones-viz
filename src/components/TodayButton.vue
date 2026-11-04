<template>
	<!--
		"Hoy" in DayPicker and MonthPicker. An action, so a button and not a link, and one of the
		row's controls: the same outline style and size as the arrows (40px, 44px on phones), as
		in calendar apps' "Today". The visible "Hoy" is part of its name, as WCAG asks; "Ir a hoy"
		says what it does.
	-->
	<UButton
		label="Hoy"
		aria-label="Ir a hoy"
		color="neutral"
		variant="outline"
		class="h-10 justify-center max-sm:h-11"
	/>
</template>
