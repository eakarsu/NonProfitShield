export function claimExamples(date = new Date().toISOString().slice(0, 10)) {
  return [
    { id: "vehicle", label: "Demo AI · Vehicle", title: "Vehicle bumper damage", description: "A low-speed impact damaged the rear bumper. Review the uploaded photos for visible damage, affected parts, repair options, and the limits of an initial cost estimate. Replace these example details with the actual incident before submitting.", incidentDate: date },
    { id: "property", label: "Demo AI · Property", title: "Property water damage", description: "A leak affected an interior wall and floor. Review the uploaded photos for visible water damage, affected materials, recommended next steps, and uncertainty about concealed damage. Replace these example details with the actual incident before submitting.", incidentDate: date },
    { id: "storm", label: "Demo AI · Storm", title: "Storm-related exterior damage", description: "A storm damaged an exterior surface. Review the uploaded photos for visible damage, repair complexity, initial parts and labor estimates, and evidence needed for review. Replace these example details with the actual incident before submitting.", incidentDate: date },
  ];
}
