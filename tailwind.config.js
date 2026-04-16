/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./public/**/*.html',
		'./src/**/*.{js,jsx,ts,tsx,vue}',
	],
	theme: {
		extend: {
			colors: {
				// Page background — near-black with a hint of green
				bg:        '#111111',
				// Card / raised surface
				surface:   '#222222',
				// Subtle borders and dividers
				border:    '#000000',

				// Body text — warm off-white
				text:      '#EDE9D0',
				// Muted text — dates, captions, labels
				muted:     '#7A7B62',

				// Accent red — links, CTAs
				red:       '#D52429',
				// Hover state for red
				'red-hot': '#F1602C',
				// Amber — secondary accent if needed
				amber:     '#EC8922',
			},
			fontFamily: {
				sans:  ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				serif: ['Georgia', 'Times New Roman', 'serif'],
				mono:  ['ui-monospace', 'Cascadia Code', 'Source Code Pro', 'monospace'],
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}
