import psycopg

conn = psycopg.connect('host=localhost dbname=hemapulse_db user=postgres password=123car456 options=-csearch_path=public')
cur = conn.cursor()

tables = ['donors', 'blood_requests', 'request_matches', 'notifications', 'hospitals', 'donor_responses']
for table in tables:
    cur.execute(f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='{table}'
        ORDER BY ordinal_position
    """)
    rows = cur.fetchall()
    print(f"\n=== {table} ===")
    for r in rows:
        print(f"  {r[0]} | {r[1]} | nullable={r[2]} | default={r[3]}")

conn.close()
