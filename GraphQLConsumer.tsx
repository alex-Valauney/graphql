'use client';

import { useEffect, useState } from 'react';
import { GraphQLClient } from 'graphql-request';

const API_URL = "https://zone01normandie.org/api/graphql-engine/v1/graphql";

export default function GraphQLConsumer() {
  const [client, setClient] = useState<GraphQLClient | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      const gqlClient = new GraphQLClient(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClient(gqlClient);

      // Exemple : test query (optionnel)
      // gqlClient.request(`{ user { id login } }`).then(console.log);
    }
  }, []);

  return (
    <div>
      {client ? "Client prêt" : "Chargement..."}
    </div>
  );
}
