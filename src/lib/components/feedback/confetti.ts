// src/lib/components/feedback/confetti.ts
// Confetti "lite" : ~24 particules DOM animées en CSS, sans dépendance ni canvas.
import { reducedMotion } from '$lib/motion';

export function confettiLite(count = 24): void {
	if (typeof document === 'undefined' || reducedMotion()) return;
	const colors = ['var(--c-primary)', 'var(--c-gold)', 'var(--c-flame)', 'var(--c-health)', 'var(--c-accent)'];
	const layer = document.createElement('div');
	layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden';
	for (let i = 0; i < count; i++) {
		const node = document.createElement('i');
		const size = 4 + Math.round(Math.random() * 4);
		const left = Math.random() * 100;
		const dx = (Math.random() * 2 - 1) * 40;
		const duration = 900 + Math.random() * 400;
		const color = colors[i % colors.length];
		node.style.cssText =
			`position:absolute;top:-12px;left:${left}vw;width:${size}px;height:${size}px;` +
			`background:rgb(${color});border-radius:1px;--dx:${dx}vw;` +
			`animation:confetti-fall ${duration}ms ease-in forwards;animation-delay:${Math.random() * 120}ms`;
		layer.appendChild(node);
	}
	document.body.appendChild(layer);
	setTimeout(() => layer.remove(), 1700);
}
