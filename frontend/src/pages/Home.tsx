import { Link } from 'react-router-dom';

const steps = [
  {
    number: '01',
    title: 'Create a request',
    description:
      'Provide the blood group, required units, urgency, and location for the request.',
  },
  {
    number: '02',
    title: 'Find compatible donors',
    description:
      'HemaPulse checks blood-group compatibility and donor availability for the request.',
  },
  {
    number: '03',
    title: 'Notify compatible donors',
    description:
      'Compatible available donors receive an in-app notification about the blood request.',
  },
];

export default function Home() {
  return (
    <div className="relative -mx-4 -my-8 overflow-hidden bg-background text-foreground sm:-mx-6 lg:-mx-8">
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-red-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -left-48 top-[28rem] h-96 w-96 rounded-full bg-slate-200/70 blur-3xl" />

      <section className="relative border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:px-12 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-surface px-3 py-1.5 text-sm font-semibold text-primary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              Smart Blood &amp; Emergency Donor Network
            </div>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              Find the right blood donor{' '}
              <span className="text-primary">when every minute matters.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              HemaPulse helps people create blood requests and connect with
              compatible, available donors through one clear network.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/requests/new"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Request Blood
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Become a Donor
              </Link>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              A clearer way to coordinate blood requests and donor responses.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:justify-self-end">
            <div className="absolute -inset-4 rounded-3xl bg-red-100/70 blur-2xl" />
            <div className="relative rounded-3xl border border-border bg-surface p-6 shadow-xl shadow-slate-200/60 sm:p-8">
              <div className="flex items-start justify-between border-b border-border pb-5">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    HemaPulse preview
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    Illustrative workflow
                  </h2>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-primary">
                  Example view
                </span>
              </div>

              <div className="space-y-4 pt-6">
                <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Example request
                    </span>
                    <span className="text-xs font-medium text-primary">
                      Compatibility preview
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-primary">A+</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Example blood group
                      </p>
                    </div>
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-white">
                      <div className="h-full w-3/4 rounded-full bg-primary" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-foreground">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Example compatible donors
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Illustrative in-app notification
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative" aria-labelledby="how-it-works-heading">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              Simple by design
            </p>
            <h2
              id="how-it-works-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              How HemaPulse works
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              A straightforward workflow keeps requests clear and helps the
              right people find each other.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md sm:p-7"
              >
                <p className="text-sm font-bold tracking-widest text-primary">
                  {step.number}
                </p>
                <h3 className="mt-8 text-xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        <div className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-center shadow-lg sm:px-12 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-300">
              Join the network
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Help make donor coordination easier.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Create your HemaPulse account and be part of a network built to
              connect requests with compatible donors.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Join HemaPulse
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
