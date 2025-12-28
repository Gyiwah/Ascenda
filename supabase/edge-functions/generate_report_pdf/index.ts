import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') {
		return new Response(null, { status: 200, headers: corsHeaders });
	}

	try {
		const supabase = createClient(
			Deno.env.get('SUPABASE_URL')!,
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
		);

		const payload = await req.json();
		// For now, call the same logic as generate_report with format='pdf'
		const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate_report`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
			body: JSON.stringify({ ...payload, format: 'pdf' }),
		});
		const body = await res.text();

		return new Response(body, {
			status: res.status,
			headers: {
				...corsHeaders,
				'Content-Type': res.headers.get('Content-Type') || 'text/html',
			},
		});
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}
});
