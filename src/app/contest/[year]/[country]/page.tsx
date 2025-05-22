import { redirect } from 'next/navigation';
import { supabase } from "@/utils/supabase";

export default async function CountryRedirect({
  params,
}: {
  params: Promise<{ year: string; country: string }>;
}) {
  const { year, country } = await params;

  // If the country is already a numeric ID, redirect to the new URL pattern
  if (!isNaN(parseInt(country, 10))) {
    redirect(`/contest/${year}/country/${country}`);
  }

  // Otherwise, try to find the country ID from the slug
  try {
    const { data } = await supabase
      .from('countries')
      .select('id')
      .eq('slug', country)
      .single();

    if (data) {
      redirect(`/contest/${year}/country/${data.id}`);
    } else {
      // If country not found, redirect to the contest page
      redirect(`/contest/${year}`);
    }
  } catch (error) {
    // If any error occurs, redirect to the contest page
    redirect(`/contest/${year}`);
  }
} 