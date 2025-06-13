import { LoginForm } from "@/components/login-form";
import { GraphQLClient } from "graphql-request";


const API_URL = "https://zone01normandie.org/api/graphql-engine/v1/graphql";

function getGraphQLClient() {
  const token = localStorage.getItem("jwt");
  return new GraphQLClient(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}


export default async function Home() {
  return (
    <main>
      <h1>Bienvenue</h1>
      <LoginForm></LoginForm>
    </main>
  );
}