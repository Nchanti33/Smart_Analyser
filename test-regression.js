// Test avec le format exact du problème de régression
const testData = `{
"Titre": "Acquisition d'un logiciel de gestion du courrier",
"Paragraphe": "Le Service d'Incendie et de Secours (SIS) de Martinique souhaite acquérir un logiciel de gestion du courrier pour centraliser les flux entrants et sortants de courriers papier et dématérialisés, assurer la traçabilité des traitements, harmoniser les pratiques d'indexation et de traitement du courrier, faciliter le partage d'informations, disposer d'outils d'alerte et d'analyse, et prévoir une évolution vers une gestion électronique des documents plus complexe à moyen terme.",
"Spécifications détectées": "Oui",
"Besoins exprimés": "Centraliser les flux de courriers, assurer la traçabilité, harmoniser les pratiques, faciliter le partage d'informations, disposer d'outils d'alerte et d'analyse, prévoir une évolution vers une gestion électronique des documents",
"Conditions": "Aucune condition spécifiée",
"Règles": "Aucune règle spécifiée",
"Contraintes": "Aucune contrainte spécifiée",
"Modalités": "Aucune modalité spécifiée",
"Résumé": "Le SIS de Martinique souhaite acquérir un logiciel de gestion du courrier pour centraliser les flux de courriers, assurer la traçabilité, harmoniser les pratiques, faciliter le partage d'informations, disposer d'outils d'alerte et d'analyse, et prévoir une évolution vers une gestion électronique des documents."
},
{
"Titre": "Livraison du logiciel",
"Paragraphe": "Le logiciel devra être livré clef en main, compatible avec l'équipement informatique existant, et permettre la numérisation, l'indexation, la recherche et la consultation des documents dématérialisés.",
"Spécifications détectées": "Oui",
"Besoins exprimés": "Permettre la numérisation, l'indexation, la recherche et la consultation des documents dématérialisés.",
"Conditions": "Clef en main - Compatibilité avec l'équipement informatique existant",
"Règles": "Aucune spécifique mentionnée",
"Contraintes": "Aucune spécifique mentionnée",
"Modalités": "Aucune spécifique mentionnée",
"Résumé": "Le logiciel doit permettre la numérisation, l'indexation, la recherche et la consultation des documents dématérialisés, être livré clef en main et compatible avec l'équipement informatique existant."
},
{
"Titre": "Formation des utilisateurs et démonstration",
"Paragraphe": "Une formation des utilisateurs est prévue, ainsi qu'une démonstration de la solution proposée. Le prestataire devra garantir la solution, assurer la maintenance et l'assistance, et respecter des délais d'intervention en cas d'anomalie.",
"Spécifications détectées": "Oui",
"Besoins exprimés": "Formation des utilisateurs, démonstration de la solution, garantie de la solution, maintenance, assistance, respect des délais d'intervention en cas d'anomalie",
"Conditions": "N/A",
"Règles": "N/A",
"Contraintes": "N/A",
"Modalités": "N/A",
"Résumé": "Les utilisateurs doivent être formés et une démonstration de la solution est requise, avec garantie, maintenance, assistance et respect des délais d'intervention en cas d'anomalie."
},
{
"Titre": "Solution MAARCH Courrier",
"Paragraphe": "Le SIS de Martinique dispose actuellement de la solution MAARCH Courrier, installée en ON-PREMISE sur des serveurs du SIS. Les principaux équipements et caractéristiques techniques du réseau, des serveurs, des postes informatiques et des équipements copieurs/scanners sont détaillés.",
"Spécifications détectées": "Oui",
"Besoins exprimés": "Gestion du courrier électronique, stockage sécurisé des documents, collaboration entre utilisateurs",
"Conditions": "Serveurs du SIS en place, réseau fonctionnel",
"Règles": "Respect des règles de confidentialité, accès sécurisé aux documents",
"Contraintes": "Contraintes techniques liées à l'installation en ON-PREMISE",
"Modalités": "Configuration de la solution sur les serveurs du SIS",
"Résumé": "La solution MAARCH Courrier est installée en ON-PREMISE sur les serveurs du SIS, permettant la gestion du courrier électronique, le stockage sécurisé des documents et la collaboration entre utilisateurs."
},
{
"Titre": "Traitement du courrier entrant",
"Paragraphe": "Les principales données relatives au traitement du courrier entrant et sortant sont fournies, ainsi que les modalités actuelles de traitement du courrier sortant.",
"Spécifications détectées": "Oui",
"Besoins exprimés": "Gérer le traitement du courrier entrant",
"Conditions": "N/A",
"Règles": "Respecter les procédures internes de traitement du courrier",
"Contraintes": "N/A",
"Modalités": "Suivre les instructions de traitement fournies par l'organisation",
"Résumé": "Gérer le traitement du courrier entrant en suivant les instructions de l'organisation."
}`;

console.log("=== Test du format de régression ===");
console.log("Length:", testData.length);
console.log("Preview:", testData.substring(0, 200));

// Test les patterns
const patterns = [
  { regex: /},\s*\n\s*{/g, name: "},\\n{" }, // },\n{ (most common)
  { regex: /}\s*\n+\s*{/g, name: "}\\n+{" }, // }\n\n{ or }\n{
  { regex: /}\s*,\s*\n\s*{/g, name: "},\\n{" }, // },\n{
  { regex: /},\s*{/g, name: "},{" }, // },{ (inline, no newline)
];

patterns.forEach((pattern) => {
  const matches = testData.match(pattern.regex);
  console.log(
    `Pattern ${pattern.name}: ${matches ? matches.length : 0} matches`
  );
});

// Test avec le meilleur pattern
const bestPattern = patterns[0]; // },\n{
const matches = testData.match(bestPattern.regex);
if (matches) {
  console.log("\\n=== Splitting with best pattern ===");
  const parts = testData.split(bestPattern.regex);
  console.log("Split into", parts.length, "parts");

  parts.forEach((part, index) => {
    console.log(`\\nPart ${index}:`);
    console.log(
      "  Preview:",
      part.substring(0, 80).replace(/\\n/g, "\\\\n") + "..."
    );

    let cleanPart = part.trim();

    // Remove array brackets if present
    if (cleanPart.startsWith("[")) {
      cleanPart = cleanPart.substring(1).trim();
    }
    if (cleanPart.endsWith("]")) {
      cleanPart = cleanPart.substring(0, cleanPart.length - 1).trim();
    }

    if (index > 0 && !cleanPart.startsWith("{")) {
      cleanPart = "{" + cleanPart;
    }

    if (index < parts.length - 1 && !cleanPart.endsWith("}")) {
      cleanPart = cleanPart + "}";
    }

    // Remove trailing comma if present
    if (cleanPart.endsWith(",}")) {
      cleanPart = cleanPart.slice(0, -2) + "}";
    }

    try {
      const parsed = JSON.parse(cleanPart);
      console.log("  ✅ Parsed successfully:", parsed.Titre);
    } catch (error) {
      console.log("  ❌ Parse failed:", error.message);
      console.log("  Content excerpt:", cleanPart.substring(0, 100));
    }
  });
}

// Test regex extraction
console.log("\\n=== Testing regex extraction ===");
const jsonObjectRegex = /\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}/g;
const regexMatches = testData.match(jsonObjectRegex);
if (regexMatches) {
  console.log("Regex found", regexMatches.length, "potential JSON objects");
  regexMatches.slice(0, 3).forEach((match, index) => {
    console.log(`Match ${index}:`, match.substring(0, 80) + "...");
  });
}
