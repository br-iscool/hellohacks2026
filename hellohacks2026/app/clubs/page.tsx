"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteChrome";

type Club = {
	id: string;
	name: string;
	instagram_handle: string;
	website_url: string | null;
};

export default function ClubsPage() {
	const [clubs, setClubs] = useState<Club[]>([]);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/clubs", { cache: "no-store" })
			.then(async (response) => {
				const payload = await response.json() as { clubs?: Club[]; error?: string };
				if (!response.ok) throw new Error(payload.error ?? `Could not load clubs (${response.status})`);
				setClubs(payload.clubs ?? []);
			})
			.catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Could not load clubs"))
			.finally(() => setLoading(false));
	}, []);

	const filteredClubs = useMemo(() => {
		const term = search.trim().toLowerCase();
		const sortedClubs = [...clubs].sort((left, right) => left.name.localeCompare(right.name));
		if (!term) return sortedClubs;
		return sortedClubs.filter((club) => `${club.name} ${club.instagram_handle} ${club.website_url ?? ""}`.toLowerCase().includes(term));
	}, [clubs, search]);

	return (
		<>
			<SiteHeader active="Clubs" />
			<main className="clubs-page">
				<section className="clubs-intro">
					<p className="micro-eyebrow coral-text">FIND YOUR PEOPLE</p>
					<div className="clubs-intro-row">
						<div>
							<h1>UBC clubs, all in one place.</h1>
							<p>Browse UBC clubs and visit their websites or Instagram profiles to learn more.</p>
						</div>
						<div className="club-stats">
							<strong>{clubs.length}<small>CLUBS LISTED</small></strong>
						</div>
					</div>
				</section>

				<section className="clubs-directory">
					<div className="clubs-toolbar">
						<label className="search-box">
							<span className="search-icon" aria-hidden="true" />
							<input
								aria-label="Search clubs"
								placeholder="Search clubs"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
						</label>
						<span className="placeholder-note">Club profiles and links are provided by the directory.</span>
					</div>
					<div className="section-title-row clubs-title-row">
						<div>
							<p className="micro-eyebrow coral-text">UBC CLUB DIRECTORY</p>
							<h2>Explore clubs</h2>
						</div>
						<span>{filteredClubs.length} clubs</span>
					</div>
					{loading && <div className="empty-state" role="status">Loading clubs…</div>}
					{loadError && <div className="empty-state" role="alert">{loadError}</div>}
					{!loading && !loadError && filteredClubs.length > 0 ? (
						<ul className="club-index">
							{filteredClubs.map((club) => {
								const instagramHandle = club.instagram_handle.replace(/^@/, "");
								const profileUrl = club.website_url
									?? `https://www.instagram.com/${encodeURIComponent(instagramHandle)}/`;
								const profileType = club.website_url ? "Website" : "Instagram";

								return (
									<li className="club-index-item" key={club.id}>
									<div className="club-index-details">
											<h3>{club.name}</h3>
											<span>@{instagramHandle}</span>
										</div>
										<a className="club-index-link" href={profileUrl} target="_blank" rel="noopener noreferrer">
											<span>{profileType}</span>
											<span aria-hidden="true">↗</span>
										</a>
									</li>
								);
							})}
						</ul>
					) : !loading && !loadError && (
						<div className="empty-state">{clubs.length ? "No clubs match that search." : "No clubs are listed yet."}</div>
					)}
				</section>
			</main>
		</>
	);
}
