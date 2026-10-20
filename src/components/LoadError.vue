<script setup lang="ts">
defineProps<{ error: Error }>()
</script>

<template>
	<!-- Side margin on phones only, where main has no padding -->
	<UAlert
		color="error"
		variant="subtle"
		icon="i-lucide-circle-alert"
		title="No se pudieron cargar los datos"
		:description="error.message"
		class="mx-4 w-auto sm:mx-0"
	/>
</template>
