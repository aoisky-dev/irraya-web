import { medusaRequest } from "./client";

export async function submitFeedback(input: {
  message: string;
  email?: string;
  name?: string;
  rating?: number;
  category?: string;
  pageUrl?: string;
  token?: string;
}): Promise<{ message: string }> {
  const response = await medusaRequest<{ message?: string }>("/store/feedback", {
    method: "POST",
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : undefined,
    body: JSON.stringify({
      message: input.message,
      email: input.email,
      name: input.name,
      rating: input.rating,
      category: input.category ?? "general",
      page_url: input.pageUrl
    })
  });

  return { message: response.message || "Thanks for your feedback!" };
}

