"use client";

import React from "react";

const FULL_STUDENT_QUERY = `
  query FullStudentStats {
    user {

      events(
        where: {
          eventId : {_eq:303}
        }
      ) {
        level
      }


      id
      login
      attrs
      auditRatio
      totalUp
      totalDown
      avatarUrl
      campus
      createdAt
      public {
        firstName
        lastName
        profile
      }
      transactions(
        where: {
          type: {_eq: "xp"}, 
          eventId : {_eq:303}
        }, 
        order_by: {createdAt: asc}
      ) {
        id
        type
        amount
        objectId
        createdAt
        path
        object {
          name
          type
        }
      }
      transactions_aggregate(
        where: {
          type: {_eq: "xp"}, 
          eventId : {_eq:303}
        }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
      progresses(where: {isDone: {_eq: true}}, order_by: {updatedAt: desc}) {
        id
        objectId
        grade
        createdAt
        updatedAt
        path
        object {
          name
          type
        }
      }
      progresses_aggregate(where: {isDone: {_eq: true}}) {
        aggregate {
          count
        }
      }
      results(order_by: {updatedAt: desc}) {
        id
        objectId
        grade
        type
        createdAt
        updatedAt
        path
        object {
          name
          type
        }
      }
      audits {
        id
        grade
        createdAt
      }
      audits_aggregate {
        aggregate {
          count
          sum {
            grade
          }
        }
      }
    }

    
  }
`;

async function exeGraphQLQuery(query: string, variables: Record<string, unknown> = {}) {
  const API_URL = "https://zone01normandie.org/api/graphql-engine/v1/graphql";
  const token = sessionStorage.getItem("jwt");
  if (!token) throw new Error("JWT token not found in sessionStorage");
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error("Failed to fetch data from GraphQL API");
  const data = await response.json();
  if (data.errors) throw new Error("GraphQL query failed: " + JSON.stringify(data.errors));
  return data.data;
}

type Transaction = {
  amount: number;
  createdAt: string;
};

function getXPPoints(transactions: Transaction[]) {
  let total = 0;
  return transactions.map(tx => {
    total += tx.amount || 0;
    return { date: tx.createdAt, xp: total };
  });
}

type Audit = { createdAt: string };

function getAuditsPerMonth(audits: Audit[]) {
  const months: Record<string, number> = {};
  audits.forEach(audit => {
    const d = new Date(audit.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = (months[key] || 0) + 1;
  });
  return months;
}

function XPLineSVG({ points }: { points: { date: string, xp: number }[] }) {
  if (points.length < 2) return <svg className="w-full h-full"></svg>;
  const width = 700, height = 320, pad = 70;
  const minXP = Math.min(...points.map(p => p.xp));
  const maxXP = Math.max(...points.map(p => p.xp));
  const scaleX = (_: string, i: number) =>
    pad + (i / (points.length - 1 || 1)) * (width - 2 * pad);
  const scaleY = (xp: number) =>
    height - pad - ((xp - minXP) / (maxXP - minXP || 1)) * (height - 2 * pad);

  const path = points.map((p, i) =>
    `${i === 0 ? "M" : "L"}${scaleX(p.date, i)},${scaleY(p.xp)}`
  ).join(" ");

  // Graduation Y (XP)
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) =>
    minXP + ((maxXP - minXP) * i) / yTicks
  );

  // Graduation X (dates, max 7 labels)
  const xLabelsCount = Math.min(7, points.length);
  const xLabelIndexes = Array.from({ length: xLabelsCount }, (_, i) =>
    Math.round(i * (points.length - 1) / (xLabelsCount - 1 || 1))
  );

  return (
    <svg width={width} height={height} className="bg-white rounded shadow">
      {/* Graduation Y */}
      {yLabels.map((val, i) => {
        const y = scaleY(val);
        return (
          <g key={i}>
            <line x1={pad - 6} y1={y} x2={width - pad} y2={y} stroke="#eee" />
            <text x={pad - 10} y={y + 4} fontSize="14" fill="#888" textAnchor="end">
              {Math.round(val).toLocaleString("fr-FR")}
            </text>
          </g>
        );
      })}
      {/* Graduation X */}
      {xLabelIndexes.map((idx, i) => {
        const x = scaleX(points[idx].date, idx);
        const d = new Date(points[idx].date);
        const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
        return (
          <g key={i}>
            <line x1={x} y1={height - pad} x2={x} y2={pad} stroke="#eee" />
            <text x={x} y={height - pad + 22} fontSize="12" fill="#888" textAnchor="middle">
              {label}
            </text>
          </g>
        );
      })}
      {/* Courbe */}
      <polyline
        fill="none"
        stroke="#22c55e"
        strokeWidth="3"
        points={points.map((p, i) => `${scaleX(p.date, i)},${scaleY(p.xp)}`).join(" ")}
      />
      <path d={path} fill="none" stroke="#22c55e" strokeWidth="3" />
      {/* Points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={scaleX(p.date, i)}
          cy={scaleY(p.xp)}
          r={4}
          fill="#22c55e"
          stroke="#fff"
          strokeWidth={1.5}
        />
      ))}
      {/* Axes */}
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#888" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#888" />
      <text x={pad} y={pad - 16} fontSize="16" fill="#333">XP</text>
      <text x={width - pad} y={height - 12} fontSize="16" fill="#333" textAnchor="end">Temps&#39;</text>
    </svg>
  );
}

function AuditsBarSVG({ auditsPerMonth }: { auditsPerMonth: Record<string, number> }) {
  const width = 700, height = 320, pad = 50;
  const months = Object.keys(auditsPerMonth).sort();
  const maxVal = Math.max(...Object.values(auditsPerMonth), 1);

  // Graduation Y (audits)
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxVal * i) / yTicks)
  );

  // Graduation X (max 7 labels, sinon saute certains mois)
  const xLabelsCount = Math.min(7, months.length);
  const xLabelIndexes = Array.from({ length: xLabelsCount }, (_, i) =>
    Math.round(i * (months.length - 1) / (xLabelsCount - 1 || 1))
  );

  return (
    <svg width={width} height={height} className="bg-white rounded shadow">
      {/* Graduation Y */}
      {yLabels.map((val, i) => {
        const y = height - pad - ((val / maxVal) * (height - 2 * pad));
        return (
          <g key={i}>
            <line x1={pad - 6} y1={y} x2={width - pad} y2={y} stroke="#eee" />
            <text x={pad - 10} y={y + 4} fontSize="12" fill="#888" textAnchor="end">
              {val}
            </text>
          </g>
        );
      })}
      {/* Barres et labels X */}
      {months.map((m, i) => {
        const barHeight = ((auditsPerMonth[m] / maxVal) * (height - 2 * pad));
        const x = pad + i * ((width - 2 * pad) / months.length) + 10;
        const [year, month] = m.split("-");
        const label = `${month}/${year.slice(2)}`;
        // Affiche le label seulement si dans xLabelIndexes
        const showLabel = xLabelIndexes.includes(i);
        return (
          <g key={m}>
            <rect
              x={x - 15}
              y={height - pad - barHeight}
              width={30}
              height={barHeight}
              fill="#3b82f6"
            />
            {showLabel && (
              <text
                x={x}
                y={height - pad + 22}
                fontSize="12"
                textAnchor="middle"
                fill="#888"
              >
                {label}
              </text>
            )}
            {/* Valeur sur chaque barre si la barre est assez haute */}
            {barHeight > 18 && (
              <text
                x={x}
                y={height - pad - barHeight - 6}
                fontSize="12"
                textAnchor="middle"
                fill="#3b82f6"
                fontWeight="bold"
              >
                {auditsPerMonth[m]}
              </text>
            )}
          </g>
        );
      })}
      {/* Axes */}
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#888" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#888" />
      <text x={pad} y={pad - 16} fontSize="16" fill="#333">Audits</text>
    </svg>
  );
}


function TeusePage() {
  type User = {
    avatarUrl?: string;
    public?: { firstName?: string; lastName?: string };
    login?: string;
    campus?: string;
    transactions?: Transaction[];
    transactions_aggregate?: { aggregate?: { sum?: { amount?: number } } };
    audits?: Audit[];
    events?: { level?: number }[];
  };

  const [user, setUser] = React.useState<User | null>(null);
  const [level, setLevel] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    exeGraphQLQuery(FULL_STUDENT_QUERY)
      .then(data => {
        if (data.user && data.user.length > 0) setUser(data.user[0]);
        else setError("Aucun utilisateur trouvé");
        if (data.user[0].events && data.user[0].events.length > 0) setLevel(data.user[0].events[0].level);

      })
      .catch(err => setError(err.message));
  }, []);

  // Prépare les données pour les SVG
  const xpPoints = user?.transactions ? getXPPoints(user.transactions) : [];
  const auditsPerMonth = user?.audits ? getAuditsPerMonth(user.audits) : {};

  return (
    <main className="min-h-screen bg-green-100 flex flex-col items-center justify-between">

      <button className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        onClick={() => {
          sessionStorage.removeItem("jwt");
          window.location.href = "/";
        }}>
        Déconnexion

      </button>
      {/* Haut : infos utilisateur */}
      <div className="w-full flex justify-center mt-20">
        {user && (
          <div className="border p-16 bg-white rounded shadow-md flex flex-col items-center w-[800px]">
            <p className="text-2xl"><span className="font-semibold">Prénom :</span> {user.public?.firstName}</p>
            <p className="text-2xl"><span className="font-semibold">Nom :</span> {user.public?.lastName}</p>
            <p className="text-2xl"><span className="font-semibold">Identifiant :</span> {user.login}</p>
            <p className="text-2xl"><span className="font-semibold">Campus :</span> {user.campus}</p>
            <p className="text-2xl"><span className="font-semibold">Niveau cursus :</span> {level}</p>
            <p className="text-2xl"><span className="font-semibold">XP cursus :</span> {user.transactions_aggregate?.aggregate?.sum?.amount?.toLocaleString() ?? "N/A"}</p>
          </div>
        )}
      </div>
      {/* Bas : deux graphes */}
      <div className="w-full flex justify-between items-end px-40 pb-24 mt-auto">
        <div className="w-[800px]">
          <h2 className="text-2xl font-bold mb-6 text-center">Courbe XP cursus</h2>
          <XPLineSVG points={xpPoints} />
        </div>
        <div className="w-[800px]">
          <h2 className="text-2xl font-bold mb-6 text-center">Audits par mois</h2>
          <AuditsBarSVG auditsPerMonth={auditsPerMonth} />
        </div>
        
      </div>
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </main>
  );
}


export default TeusePage;