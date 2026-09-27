"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EventInfo } from "@/lib/data/events";
import { eventCategory, eventPrice, fetchEvents } from "@/lib/api";
import { CategoryTag } from "./discover/CategoryTag";
import { EventCard } from "./discover/EventCard";
import { SearchBox } from "./discover/SearchBox";
import { SiteHeader } from "./SiteChrome";
import { EventDetailsDialog, type CalendarEvent } from "./CalendarPage";

export default function DiscoverPage() {
	const [events, setEvents] = useState<EventInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [selectedTag, setSelectedTag] = useState<string | null>(null);
	const [showAllTags, setShowAllTags] = useState(false);
	const [dialogEvent, setDialogEvent] = useState<CalendarEvent | null>(null);
	useEffect(() => {
		const now = new Date();
		const start = new Date(now);
		start.setHours(0, 0, 0, 0);
		const end = new Date(start);
		end.setFullYear(end.getFullYear() + 1);
		fetchEvents(start, end).then((rows) => setEvents(rows.map((event, index) => {
			const start = event.starts_at ? new Date(event.starts_at) : null;
							return {
								id: event.id,
								calendarDate: start ? start.toISOString().slice(0, 10) : undefined,
								startHour: start?.getHours() ?? 0,
								startMinute: start?.getMinutes() ?? 0,
								hasStartTime: event.has_start_time,
				title: event.name,
				club: event.club?.name ?? event.organization ?? "UBC Club",
				category: eventCategory(event),
				tags: [...new Set(event.tags.map((tag) => tag.trim()).filter(Boolean))],
				date: start ? start.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "Date TBA",
				time: start && event.has_start_time ? start.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" }) : "Time TBA",
				place: event.location ?? "Location TBA",
				price: eventPrice(event),
				description: event.description,
				image: (index % 6) + 1,
				imageUrl: event.image_url,
			};
		}))).catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Could not load events")).finally(() => setLoading(false));
	}, []);
	const popularTags = useMemo(() => {
		const counts = new Map<string, number>();
		for (const event of events) {
			for (const tag of new Set(event.tags.map((value) => value.toLocaleLowerCase()))) {
				counts.set(tag, (counts.get(tag) ?? 0) + 1);
			}
		}
		return [...counts.entries()]
			.sort(([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB))
			.map(([tag, count]) => ({ tag, count }));
	}, [events]);
	const topTags = popularTags.slice(0, 5);
	const remainingTags = popularTags.slice(5);
	const renderTagButton = ({ tag, count }: { tag: string; count: number }) => (
		<button
			key={tag}
			className={`category-chip ${selectedTag === tag ? "chip-selected" : ""}`}
			aria-pressed={selectedTag === tag}
			aria-label={`${tag}, ${count} ${count === 1 ? "event" : "events"}`}
			onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
		>
			<CategoryTag name={tag} count={count} />
		</button>
	);
	const filteredEvents = useMemo(
		() => events.filter((event) => {
			const searchableText = `${event.title} ${event.club} ${event.place}`.toLowerCase();
			const matchesSearch = searchableText.includes(search.toLowerCase());
			const matchesTag = selectedTag === null || event.tags.some((tag) => tag.toLocaleLowerCase() === selectedTag);

			return matchesSearch && matchesTag;
		}),
		[events, search, selectedTag],
	);
	const featuredEvents = filteredEvents.slice(0, 2);
	const upcomingEvents = filteredEvents.slice(2);
	const todayLabel = new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
	const todayEvents = events.filter((event) => event.date === todayLabel);
	const scrollToEvents = () => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
	const openEvent = (event: EventInfo) => {
		if (!event.calendarDate) return;
		setDialogEvent({
			id: event.id ?? event.title,
			date: event.calendarDate,
			startHour: event.startHour ?? 0,
			startMinute: event.startMinute ?? 0,
			hasStartTime: event.hasStartTime,
			title: event.title,
			club: event.club,
			tags: event.tags,
			color: "#0055b8",
			place: event.place,
			price: event.price,
			description: event.description,
			details: event.description,
			image: event.image,
			imageUrl: event.imageUrl ?? null,
		});
	};

	return (
		<>
			<SiteHeader active="Discover" />
			<main>
				<section className="hero-section">
					<div className="hero-orb" aria-hidden="true" />
					<div className="hero-inner">
						<div className="hero-copy">
							<p className="eyebrow"><span className="eyebrow-dot" /> UPCOMING UBC EVENTS</p>
							<h1>What&apos;s cooking in UBC?</h1>
							<p className="hero-description">
								A clearer way to find the talks, workshops, socials, games, and moments that you wouldn&apos;t find out about otherwise.
							</p>
							<div className="hero-search-row">
								<SearchBox value={search} onChange={setSearch} />
								<button className="button button-primary" onClick={scrollToEvents}>
									Find events
								</button>
							</div>
							<div className="explore-tag-section">
								<div className="explore-row">
									<span>Explore:</span>
									{topTags.map(renderTagButton)}
									{remainingTags.length > 0 && (
										<button
											className="explore-more-button"
											aria-expanded={showAllTags}
											aria-controls="more-explore-tags"
											onClick={() => setShowAllTags(!showAllTags)}
										>
											{showAllTags ? "Show less" : `More tags (${remainingTags.length})`}
										</button>
									)}
								</div>
								{showAllTags && remainingTags.length > 0 && (
									<div className="explore-more-tags" id="more-explore-tags">
										{remainingTags.map(renderTagButton)}
									</div>
								)}
							</div>
						</div>
						<aside className="today-card" aria-label="Today on campus">
							<div className="today-heading">
								<div>
									<span className="micro-eyebrow coral-text">TODAY</span>
									<h2>{new Date().toLocaleDateString("en-CA", { month: "long", day: "numeric" })}</h2>
								</div>
								<span className="event-count">{todayEvents.length} events</span>
							</div>
							<div className="today-events-scroll" aria-label="Events happening today">
								{todayEvents.length > 0 ? todayEvents.map((event) => (
									<button className="happening-card" key={event.id ?? event.title} onClick={() => openEvent(event)}>
										<span className="live-label"><i aria-hidden="true" /> TODAY ON CAMPUS</span>
										<strong>{event.title}</strong>
										<span>{event.club} · {event.time}</span>
									</button>
								)) : (
							<div className="happening-card">
								<span className="live-label"><i aria-hidden="true" /> TODAY ON CAMPUS</span>
								<strong>{todayEvents[0]?.title ?? "No events scheduled today"}</strong>
								<span>{todayEvents[0] ? `${todayEvents[0].club} � ${todayEvents[0].time}` : "Check upcoming events below."}</span>
							</div>
							)}
							</div>
						</aside>
					</div>
				</section>

				<section className="discovery-section" id="events">
					<div className="section-title-row editor-title-row">
						<div>
							<p className="micro-eyebrow coral-text">EDITOR’S PICKS</p>
							<h2>Worth leaving the library for</h2>
						</div>
						<Link className="text-link" href="/calendar">See all featured →</Link>
					</div>
					{loading && <div className="empty-state" role="status">Loading events…</div>}
					{loadError && <div className="empty-state" role="alert">{loadError}</div>}
					{!loading && !loadError && featuredEvents.length > 0 ? (
						<div className="featured-grid">
							{featuredEvents.map((event) => <EventCard key={event.title} event={event} onClick={(click) => { click.preventDefault(); openEvent(event); }} />)}
						</div>
					) : !loading && !loadError && (
						<div className="empty-state">No events found. Try another search or category.</div>
					)}

					<div className="section-title-row upcoming-title-row">
						<div>
							<p className="micro-eyebrow coral-text">COMING UP</p>
							<h2>More around campus</h2>
						</div>
						<Link className="text-link" href="/calendar">View all 87 events →</Link>
					</div>
					{!loading && !loadError && upcomingEvents.length > 0 ? (
						<div className="upcoming-grid">
							{upcomingEvents.map((event) => <EventCard compact key={event.title} event={event} onClick={(click) => { click.preventDefault(); openEvent(event); }} />)}
						</div>
					) : !loading && !loadError && events.length > 0 && (
						<div className="empty-state">No more events in this view yet.</div>
					)}

					<aside className="source-banner">
						<div>
							<h2>Made from the posts you might have missed.</h2>
							<p>
								We list published event details and link back to their source so you can confirm the latest updates.
							</p>
						</div>
						<Link className="button button-light" href="/faq">How it works</Link>
					</aside>
				</section>
			</main>
			{dialogEvent && <EventDetailsDialog event={dialogEvent} onClose={() => setDialogEvent(null)} />}
		</>
	);
}
