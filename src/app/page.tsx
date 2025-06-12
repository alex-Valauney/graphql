import { LoginForm } from "@/components/login-form";
import { GraphQLClient } from "graphql-request";


const API_URL = "https://zone01normandie.org/api/graphql-engine/v1/graphql";

export function getGraphQLClient() {
  const token = localStorage.getItem("jwt");
  return new GraphQLClient(API_URL, {
    headers: {
      Authorization: 'Bearer ${token}',
    },
  });
}

async function Login() {

  const username = (document.getElementById("username") as HTMLInputElement)?.value || null;
  const password = (document.getElementById("password") as HTMLInputElement)?.value || null;
  
  if (!username || !password) {
    throw new Error("Username and password are required");
  }
  const token = GraphQLClient;
  const res = await fetch ("https://zone01normandie.org/api/auth/signin")

  if (!res.ok) {
    throw new Error("Failed to fetch token");
  }
  const data = await res.json();
  localStorage.setItem("jwt", data.token);
  return data.token;
}

export default async function Home() {
  return (
    <main>
      <h1>Bienvenue</h1>
      <LoginForm></LoginForm>
    </main>
  );
}