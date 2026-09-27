"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";

type NavigationLabel = "Discover" | "Calendar" | "Clubs" | "FAQ";

const links: { label: NavigationLabel; href: string }[] = [
	{ label: "Discover", href: "/" },
	{ label: "Calendar", href: "/calendar" },
	{ label: "Clubs", href: "/clubs" },
	{ label: "FAQ", href: "/faq" },
];

function SiteHeader({ active }: { active: NavigationLabel }) {
	const navRef = useRef<HTMLElement>(null);
	const indicatorRef = useRef<HTMLSpanElement>(null);
	const positionedRef = useRef(false);

	useLayoutEffect(() => {
		const nav = navRef.current;
		const indicator = indicatorRef.current;
		const activeLink = nav?.querySelector<HTMLAnchorElement>(`[data-nav-label="${active}"]`);
		if (!nav || !indicator || !activeLink) return;

		const positionIndicator = () => {
			if (!positionedRef.current) indicator.style.transition = "none";
			const left = activeLink.offsetLeft + (activeLink.offsetWidth - 28) / 2;
			indicator.style.transform = `translateX(${left}px)`;
			indicator.style.opacity = "1";

			if (!positionedRef.current) {
				positionedRef.current = true;
				requestAnimationFrame(() => indicator.style.removeProperty("transition"));
			}
		};

		positionIndicator();
		window.addEventListener("resize", positionIndicator);
		return () => window.removeEventListener("resize", positionIndicator);
	}, [active]);

	return (
		<header id="top" className="site-header">
			<Link className="brand" href="/#top" aria-label="Findr home">
				<span className="brand-mark"><Image src="/assets/logo.png" alt="" width={36} height={36} /></span>
			</Link>
			<nav className="main-nav" aria-label="Main navigation" ref={navRef}>
				{links.map((link) => (
					<Link
						key={link.label}
						data-nav-label={link.label}
						aria-current={active === link.label ? "page" : undefined}
						className={active === link.label ? "nav-active" : ""}
						href={link.href}
					>
						{link.label}
					</Link>
				))}
				<span className="nav-active-indicator" ref={indicatorRef} aria-hidden="true" />
			</nav>
		</header>
	);
}

export function AppShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const active: NavigationLabel = pathname === "/calendar"
		? "Calendar"
		: pathname === "/clubs"
			? "Clubs"
			: pathname === "/faq"
				? "FAQ"
				: "Discover";

	return (
		<>
			<SiteHeader active={active} />
			<div className={`route-content ${pathname === "/calendar" ? "route-content-calendar" : ""}`} key={pathname}>
				{children}
			</div>
		</>
	);
}
