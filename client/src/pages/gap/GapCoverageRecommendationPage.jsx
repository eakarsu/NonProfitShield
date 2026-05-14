// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapCoverageRecommendationPage() {
  return (
    <GapFeaturePage
      title="Coverage Recommendation Engine"
      description="Coverage Recommendation Engine"
      slug="coverage-recommendation"
      aiResultKey="recommendation"
      fields={[
  {
    "name": "orgName",
    "label": "Organization Name",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "orgType",
    "label": "Org Type",
    "required": false,
    "placeholder": ""
  },
  {
    "name": "annualBudget",
    "label": "Annual Budget",
    "type": "number"
  }
]}
    />
  )
}
