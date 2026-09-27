"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { eventPrice, fetchEventDetails, fetchEvents, type EventDetails } from "@/lib/api";
import { averageTagColor } from "@/lib/tagColors";
import { CategoryTag } from "./discover/CategoryTag";
import { SiteHeader } from "./SiteChrome";

export type CalendarEvent = {
	id: string;
	date: string;
	startHour: number;
	startMinute: number;
	title: string;
	club: string;
	tags: string[];
	color: string;
	place: string;
	price: string;
	description: string;
	details: string;
	image: number;
	imageUrl: string | null;
	hasStartTime?: boolean;
};

const today = toDateKey(new Date());
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function toDateKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function formatTime(hour: number, minute: number) {
	const suffix = hour >= 12 ? "PM" : "AM";
	const displayHour = hour % 12 || 12;
	return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatDate(dateKey: string, options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric" }) {
	return new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-CA", options);
}

function startOfWeek(date: Date) {
	const start = new Date(date);
	start.setDate(start.getDate() - start.getDay());
	start.setHours(12, 0, 0, 0);
	return start;
}

function SidebarTagScroller({ tags }: { tags: string[] }) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const firstGroupRef = useRef<HTMLDivElement>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);

	useEffect(() => {
		const viewport = viewportRef.current;
		const firstGroup = firstGroupRef.current;
		if (!viewport || !firstGroup) return;

		const measure = () => {
			const expandedForScroll = viewport.classList.contains("is-overflowing");
			const availableWidth = viewport.clientWidth - (expandedForScroll ? 24 : 0);
			setIsOverflowing(firstGroup.scrollWidth > availableWidth);
		};
		const frame = requestAnimationFrame(measure);
		const observer = new ResizeObserver(measure);
		observer.observe(viewport);
		observer.observe(firstGroup);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, [tags]);

	return (
		<div ref={viewportRef} className={`day-event-tags day-event-tags-scroll ${isOverflowing ? "is-overflowing" : ""}`}>
			<div className="day-event-tags-track">
				<div ref={firstGroupRef} className="day-event-tags-group">
					{tags.map((tag) => <CategoryTag key={tag} name={tag} />)}
				</div>
				{isOverflowing && (
					<div className="day-event-tags-group" aria-hidden="true">
						{tags.map((tag) => <CategoryTag key={tag} name={tag} />)}
					</div>
				)}
			</div>
		</div>
	);
}

export function EventDetailsDialog({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
	const [details, setDetails] = useState<EventDetails | null>(null);
	const [detailsError, setDetailsError] = useState<string | null>(null);
	useEffect(() => {
		let active = true;
		fetchEventDetails(event.id)
			.then((result) => { if (active) setDetails(result); })
			.catch((error: unknown) => { if (active) setDetailsError(error instanceof Error ? error.message : "Could not load event links"); });
		return () => { active = false; };
	}, [event.id]);
	useEffect(() => {
		const onKeyDown = (keyboardEvent: KeyboardEvent) => {
			if (keyboardEvent.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);
	const missingDetails = "Check additional post details";
	const time = event.hasStartTime === false ? missingDetails : formatTime(event.startHour, event.startMinute);

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title" onClick={(eventClick) => eventClick.stopPropagation()}>
				<button className="modal-close" aria-label="Close event details" onClick={onClose}>×</button>
				<div className="modal-image" style={event.imageUrl ? { backgroundImage: `url(${JSON.stringify(event.imageUrl)})` } : undefined}>
					{!event.imageUrl && <Image src={`/event-photos/event-${event.image}.jpg`} alt={`Students at ${event.title}`} width={900} height={400}/>}
				</div>
				<div className="modal-content">
					{event.tags.length > 0 && (
						<div className="day-event-tags" aria-label="Event tags">
							{event.tags.map((tag) => <CategoryTag key={tag} name={tag} />)}
						</div>
					)}
					<p className="micro-eyebrow coral-text">{formatDate(event.date)}</p>
					<h2 id="event-modal-title">{event.title}</h2>
					<p className="club-link">{event.club}</p>
					<div className="modal-facts">
						<span><strong>Time:</strong> {time}</span>
						<span><strong>Location:</strong> {event.place || missingDetails}</span>
						<span><strong>Price:</strong> {event.price || missingDetails}</span>
					</div>
					<h3>About this event</h3>
					<p>{event.description || missingDetails}</p>
					{details?.registration_url && <p><a href={details.registration_url} target="_blank" rel="noreferrer">Register for this event ↗</a></p>}
					<h3>Event source</h3>
					{details ? (
						<ul>
							{[details.source_url, ...details.sources.map((source) => source.canonical_url)]
								.filter((url, index, urls) => Boolean(url) && urls.indexOf(url) === index)
								.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer">View original announcement ↗</a></li>)}
						</ul>
					) : <p role={detailsError ? "alert" : "status"}>{detailsError ?? "Loading source links…"}</p>}
					<div className="modal-note">Event information may change. Confirm details with the organizer before attending.</div>
				</div>
			</section>
		</div>
	);
}

export default function CalendarPage() {
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [view, setView] = useState<"Week" | "Month">("Week");
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [selectedDate, setSelectedDate] = useState(today);
	const [search, setSearch] = useState("");
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
	const [dialogEventId, setDialogEventId] = useState<string | null>(null);
	useEffect(() => {
		const now = new Date();
		const start = new Date(now);
		start.setFullYear(now.getFullYear() - 1);
		const todayStart = new Date(now);
		todayStart.setHours(0, 0, 0, 0);
		const end = new Date(now);
		end.setFullYear(now.getFullYear() + 1);
		Promise.all([fetchEvents(start, todayStart), fetchEvents(todayStart, end)])
			.then(([pastRows, upcomingRows]) => {
				const rows = [...new Map([...pastRows, ...upcomingRows].map((event) => [event.id, event])).values()]
					.sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));
				const mapped = rows.flatMap((event, index) => {
					if (!event.starts_at) return [];
					const date = new Date(event.starts_at);
					const tags = [...new Set(event.tags.map((tag) => tag.trim()).filter(Boolean))];
					return [{
						id: event.id,
						date: toDateKey(date),
						startHour: date.getHours(),
						startMinute: date.getMinutes(),
						title: event.name,
						club: event.club?.name ?? event.organization ?? "UBC Club",
						tags,
						color: averageTagColor(tags),
						place: event.location ?? "Location TBA",
						price: eventPrice(event),
						description: event.description,
						details: event.description,
						image: (index % 6) + 1,
						imageUrl: event.image_url,
						hasStartTime: event.has_start_time,
					}];
				});
				setEvents(mapped);
				const params = new URLSearchParams(window.location.search);
				const requestedEvent = params.get("event");
				const requestedDate = params.get("date");
				const requestedClub = params.get("club");
				const matchedEvent = requestedEvent
					? mapped.find((event) => event.title === requestedEvent || event.id === requestedEvent)
					: requestedClub ? mapped.find((event) => event.club === requestedClub) : undefined;
				if (matchedEvent) {
					setSelectedDate(matchedEvent.date);
					setSelectedEventId(matchedEvent.id);
				} else if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
					setSelectedDate(requestedDate);
				}
				if (requestedClub) setSearch(requestedClub);
			})
			.catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Could not load events"))
			.finally(() => setLoading(false));
	}, []);
	const selected = new Date(`${selectedDate}T12:00:00`);
	const visibleEvents = useMemo(() => events.filter((event) => {
		const matchesSearch = `${event.title} ${event.club} ${event.place}`.toLowerCase().includes(search.toLowerCase());
		return matchesSearch;
	}), [events, search]);
	const selectedEvents = visibleEvents.filter((event) => event.date === selectedDate);
	const hasEventsOnSelectedDate = events.some((event) => event.date === selectedDate);
	const modalEvent = events.find((event) => event.id === dialogEventId);
	const weekStart = startOfWeek(selected);
	const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
	const monthTitle = `${monthNames[selected.getMonth()]} ${selected.getFullYear()}`;
	const periodStart = view === "Week" ? weekStart : monthStart;
	const todayDate = new Date(`${today}T12:00:00`);
	const earliestDate = new Date(todayDate);
	earliestDate.setFullYear(earliestDate.getFullYear() - 1);
	const earliestPeriod = view === "Week"
		? startOfWeek(earliestDate)
		: new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1, 12);
	const canGoBack = periodStart > earliestPeriod;
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 6);
	const weekLabel = `${monthNames[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()} – ${monthNames[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
	const dayCount = view === "Week" ? 7 : new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate();
	const monthOffset = view === "Week" ? 0 : monthStart.getDay();
	const cellCount = view === "Week" ? 7 : Math.ceil((monthOffset + dayCount) / 7) * 7;
	const calendarDates = Array.from({ length: cellCount }, (_, index) => {
		if (view === "Week") {
			const date = new Date(weekStart);
			date.setDate(date.getDate() + index);
			return date;
		}

		return new Date(selected.getFullYear(), selected.getMonth(), index - monthOffset + 1, 12);
	});

	function movePeriod(direction: number) {
		const nextDate = new Date(selected);
		if (view === "Week") nextDate.setDate(nextDate.getDate() + direction * 7);
		else nextDate.setMonth(nextDate.getMonth() + direction, 1);
		setSelectedDate(toDateKey(nextDate));
		setDialogEventId(null);
	}

	function selectDate(date: Date) {
		setSidebarOpen(true);
		setSelectedDate(toDateKey(date));
		setSelectedEventId(null);
		setDialogEventId(null);
	}

	function selectEvent(event: CalendarEvent) {
		setSidebarOpen(true);
		setSelectedDate(event.date);
		setSelectedEventId(event.id);
	}

	return (
		<>
			<SiteHeader active="Calendar" />
			<main className="calendar-page">
				<div className="calendar-heading-row">
					<div>
						<p className="micro-eyebrow coral-text">{view === "Week" ? "EVENT CALENDAR" : "PLAN AHEAD"}</p>
						<h1>{view === "Week" ? "This week" : monthTitle}</h1>
					</div>
					<div className="calendar-controls">
						<button className="filter-button" onClick={() => selectDate(todayDate)}>Today</button>
						<button className="calendar-arrow" disabled={!canGoBack} aria-label={`Previous ${view.toLowerCase()}`} onClick={() => movePeriod(-1)}>‹</button>
						<strong>{view === "Week" ? weekLabel : monthTitle}</strong>
						<button className="calendar-arrow" aria-label={`Next ${view.toLowerCase()}`} onClick={() => movePeriod(1)}>›</button>
						<div className="view-switch" role="group" aria-label="Calendar view">
							<button className={view === "Week" ? "view-selected" : ""} aria-pressed={view === "Week"} onClick={() => setView("Week")}>Week</button>
							<button className={view === "Month" ? "view-selected" : ""} aria-pressed={view === "Month"} onClick={() => setView("Month")}>Month</button>
						</div>
					</div>
				</div>

				<div className="calendar-filter-row">
					<label className="search-box"><span className="search-icon" aria-hidden="true"/><input placeholder="Search events, clubs, or places" aria-label="Search calendar events" value={search} onChange={(event) => setSearch(event.target.value)}/></label>
					<div className="filter-actions">
						<button
							className="filter-button calendar-sidebar-toggle"
							aria-expanded={sidebarOpen}
							aria-controls="calendar-day-sidebar"
							aria-label={sidebarOpen ? "Collapse day panel" : "Expand day panel"}
							title={sidebarOpen ? "Collapse day panel" : "Expand day panel"}
							onClick={() => setSidebarOpen((open) => !open)}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
								<rect x="3.5" y="4" width="17" height="16" rx="2" />
								<path d="M15 4v16" />
								<path d={sidebarOpen ? "M8 9l3 3-3 3" : "M10 9l-3 3 3 3"} />
							</svg>
						</button>
					</div>
				</div>

				{loading && <p role="status">Loading events…</p>}
				{loadError && <p role="alert" className="empty-state">{loadError}</p>}
				<div className={`calendar-workspace calendar-${view.toLowerCase()} ${sidebarOpen ? "" : "calendar-sidebar-collapsed"}`}>
					<section className={`calendar-grid calendar-grid-${view.toLowerCase()}`} aria-label={`${view} calendar`}>
						<div className="calendar-weekday-row"><span className="calendar-time-gutter"/>{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
						<div className={`calendar-dates ${view === "Month" ? "calendar-dates-month" : ""}`}>
							{calendarDates.map((date, index) => {
								const dateKey = toDateKey(date);
								const dayEvents = visibleEvents.filter((event) => event.date === dateKey);
								const displayedEvents = dayEvents.slice(0, view === "Week" ? 8 : 2);
								const remainingEventCount = dayEvents.length - displayedEvents.length;
								const inCurrentMonth = date.getMonth() === selected.getMonth();
								return (
									<div key={dateKey} className={`calendar-date-cell ${view === "Week" ? "calendar-date-week" : ""} ${dateKey === selectedDate ? "calendar-date-selected" : ""} ${dateKey === today ? "calendar-date-today" : ""} ${view === "Month" && !inCurrentMonth ? "calendar-date-outside" : ""}`}>
										{view === "Month" ? (
											<button
												type="button"
												className="calendar-month-day-button"
												aria-label={`Select ${formatDate(dateKey)}, ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}`}
												aria-pressed={dateKey === selectedDate}
												onClick={() => selectDate(date)}
											>
												<div className="calendar-date-heading">
													<span className="calendar-date-short">{weekdays[date.getDay()]}</span>
													<strong>{date.getDate()}</strong>
												</div>
												<div className="calendar-date-events">
													{displayedEvents.map((event) => (
														<span key={event.id} className="calendar-event-block" style={{ backgroundColor: event.color }} title={`${formatTime(event.startHour, event.startMinute)} - ${event.title}`}>
															<strong>{formatTime(event.startHour, event.startMinute)}</strong>
															<span>{event.title}</span>
														</span>
													))}
													{remainingEventCount > 0 && <span className="calendar-more-events">+{remainingEventCount} More</span>}
												</div>
											</button>
										) : (
											<>
												<button className="calendar-date-heading" onClick={() => selectDate(date)} aria-pressed={dateKey === selectedDate}>
													<span className="calendar-date-short">{weekdays[index]}</span>
													<strong>{date.getDate()}</strong>
												</button>
												<div className="calendar-date-events" aria-label={`${dayEvents.length} events`}>
													{displayedEvents.map((event) => (
														<button key={event.id} className="calendar-event-block" style={{ backgroundColor: event.color }} onClick={() => selectEvent(event)} title={`${formatTime(event.startHour, event.startMinute)} - ${event.title}`}>
															<strong>{formatTime(event.startHour, event.startMinute)}</strong>
															<span>{event.title}</span>
														</button>
													))}
													{remainingEventCount > 0 && (
														<button className="calendar-more-events" onClick={() => selectDate(date)}>
															+{remainingEventCount} More
														</button>
													)}
												</div>
											</>
										)}
									</div>
								);
							})}
						</div>
					</section>

					<aside id="calendar-day-sidebar" className="calendar-event-detail calendar-day-event-list" aria-label={`Events for ${formatDate(selectedDate)}`}>
						<header className="day-event-list-header">
							<p className="micro-eyebrow coral-text">SELECTED DAY</p>
							<h2>{formatDate(selectedDate)}</h2>
							<span>{selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}</span>
						</header>
						{selectedEvents.length > 0 ? (
							<div className="day-event-list-scroll">
								{selectedEvents.map((event) => (
									<div className="day-event-entry" key={event.id}>
										<article
											className={`day-event-item ${selectedEventId === event.id ? "day-event-item-selected" : ""}`}
											style={{
												backgroundImage: `linear-gradient(180deg, rgb(8 29 44 / 30%), rgb(8 29 44 / 88%)), url(${JSON.stringify(event.imageUrl ?? `/event-photos/event-${event.image}.jpg`)})`,
												borderLeft: `4px solid ${event.color}`,
											}}
										>
											<div className="day-event-item-meta">
												<span className="day-event-dot" style={{ backgroundColor: event.color }} aria-hidden="true" />
												<time>{formatTime(event.startHour, event.startMinute)}</time>
												<span>{event.price}</span>
											</div>
											{event.tags.length > 0 && <SidebarTagScroller tags={event.tags} />}
											<h3>{event.title}</h3>
											<p className="club-link">{event.club}</p>
											<p className="day-event-place">{event.place}</p>
											<button className="text-link" onClick={() => { selectEvent(event); setDialogEventId(event.id); }}>View details</button>
										</article>
									</div>
								))}
							</div>
						) : (
							<div className="calendar-no-selection">
								<span className="calendar-no-selection-icon">&mdash;</span>
								<h2>{hasEventsOnSelectedDate ? "No matching events" : "No events this day"}</h2>
								<p>{hasEventsOnSelectedDate ? "Try changing your search." : "Choose another date to see its events."}</p>
							</div>
						)}
					</aside>
				</div>
				<p className="calendar-note">Check with each organizer for the latest event updates.</p>
			</main>
			{modalEvent && <EventDetailsDialog event={modalEvent} onClose={() => setDialogEventId(null)} />}
		</>
	);
}
