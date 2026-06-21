/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./public/**/*.html',
		'./src/**/*.{js,jsx,ts,tsx,vue}',
	],
	theme: {
		extend: {
			colors: {
				bg:           '#111111',
				surface:      '#1a1a1a',
				elevated:     '#242424',
				border:       '#2a2a2a',

				fg:           '#EDE9D0',
				text:         '#EDE9D0',
				muted:        '#7A7B62',

				accent:       '#D52429',
				'accent-soft':'#F1602C',
				red:          '#D52429',
				'red-hot':    '#F1602C',
				amber:        '#EC8922',
			},
			fontFamily: {
				sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				display: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'sans-serif'],
				serif:   ['Space Grotesk', 'Inter', 'ui-sans-serif', 'sans-serif'],
				mono:    ['JetBrains Mono', 'ui-monospace', 'Cascadia Code', 'monospace'],
			},
			maxWidth: {
				container: '72rem',
			},
			keyframes: {
				'fade-in-up': {
					'0%':   { opacity: '0', transform: 'translateY(16px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
			},
			animation: {
				'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}
