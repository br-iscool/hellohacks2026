import Link from "next/link";
import Image from "next/image";

type SiteHeaderProps = {
	active: "Discover" | "Calendar" | "Clubs" | "FAQ";
};

export function SiteHeader({ active }: SiteHeaderProps) {
	const links = [
		{ label: "Discover", href: "/" },
		{ label: "Calendar", href: "/calendar" },
		{ label: "Clubs", href: "/clubs" },
		{ label: "FAQ", href: "/faq" },
	];

	return (
		<header id="top" className="site-header">
			<Link className="brand" href="/#top" aria-label="Findr home">
				<span className="brand-mark"><Image src="/assets/logo.png" alt="" width={36} height={36} /></span>
			</Link>
			<nav className="main-nav" aria-label="Main navigation">
				{links.map((link) => (
					<Link
						key={link.label}
						className={active === link.label ? "nav-active" : ""}
						href={link.href}
					>
						{link.label}
					</Link>
				))}
			</nav>
		</header>
	);
}
