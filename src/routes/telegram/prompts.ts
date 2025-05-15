//TODO: the categories are hardcoded for testing purposes
export const categoriesArr = [
	[
		"f495bafd-f0f6-4f73-872b-2e87108ae047",
		"Comida y Restaurantes",
		"Comestibles, restaurantes y entrega de comida",
	],
	[
		"36289cde-b8a6-46a3-8acf-a896f77366a0",
		"Transporte",
		"Transporte público, combustible, mantenimiento del coche y servicios de transporte",
	],
	[
		"76ebb149-81a1-4345-8ba1-39e1eab34441",
		"Vivienda",
		"Alquiler, hipoteca, servicios públicos y mantenimiento del hogar",
	],
	[
		"d70d1b26-6477-4b1e-93e6-96b9d2ff7801",
		"Entretenimiento",
		"Películas, juegos, servicios de streaming y pasatiempos",
	],
	[
		"0f5cb562-e411-4860-b461-acce5b703dfd",
		"Compras",
		"Ropa, electrónicos y artículos personales",
	],
	[
		"0c8fe053-f03b-476d-9fa0-b524ce2e4228",
		"Salud",
		"Gastos médicos, medicamentos y seguros",
	],
	[
		"485a75ea-90f6-4535-83cd-90d43552e076",
		"Educación",
		"Matrícula, libros, cursos y capacitación",
	],
	[
		"51f2dd7d-7ecc-4a12-a47a-03c57b845e29",
		"Facturas y Servicios",
		"Teléfono, internet, electricidad y otros servicios",
	],
	[
		"183136a0-8c55-48fb-909b-1e227ee34bb4",
		"Viajes",
		"Vacaciones, hoteles y vuelos",
	],
	["1db9dc71-2a13-4581-a3ab-a187d7d1b9f2", "Otros", "Gastos varios"],
];

export const botRol =
	"<rol>Soy Zupfi, tu asistente para la gestión de finanzas personales.</rol>";
export const botInstructions = `
<instrucciones>
1. Mi función principal es ayudarte a registrar y consultar tus gastos.
2. Puedo ofrecerte consejos de ahorro breves y concisos.
3. IMPORTANTE: No doy consejos de inversión. Si me preguntas sobre inversiones, te indicaré amablemente que no es mi especialidad.
</instrucciones>
`;

export const agentPrompt = `${botRol} ${botInstructions}`;
export const agentPromptV2 = `**Directrices para Zupfi, Asistente de Finanzas Personales:**

Eres Zupfi. Tu objetivo principal es ayudar a los usuarios con el registro y consulta de sus gastos.
Adicionalmente:
* Ofrece consejos de ahorro que sean siempre breves y concisos.
* NUNCA des consejos de inversión. Si te consultan, declina amablemente informando que no es tu área.

Tono: Amigable y servicial.

Responde al siguiente mensaje del usuario:`;
