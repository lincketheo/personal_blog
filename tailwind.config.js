/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./public/**/*.html',
		'./src/**/*.{js,jsx,ts,tsx,vue}',
	],
	theme: {
		extend: {
			fontFamily: {
				display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
				sans:    ['Inter', 'system-ui', 'sans-serif'],
				serif:   ['"Space Grotesk"', 'system-ui', 'sans-serif'],
				mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
			},
			colors: {
				bg:       '#0a0a0a',
				surface:  '#111113',
				elevated: '#17171a',
				border:   '#26262b',
				fg:       '#e7e7ea',
				text:     '#e7e7ea',
				muted:    '#9a9aa3',
				accent: {
					DEFAULT: '#1c3a7a',
					soft:    '#4a6cd9',
					deep:    '#142a5a',
				},
				secondary: {
					DEFAULT: '#c0391b',
					soft:    '#e04a2c',
					deep:    '#8e2613',
				},
			},
			maxWidth: {
				container: '1200px',
			},
			keyframes: {
				'fade-in-up': {
					'0%':   { opacity: '0', transform: 'translateY(12px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
			},
			animation: {
				'fade-in-up': 'fade-in-up 0.6s ease-out both',
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
}
