// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapClaimRiskScorerPage() {
  return (
    <GapFeaturePage
      title="Claim Risk Scorer"
      description="Claim Risk Scorer"
      slug="claim-risk-scorer"
      aiResultKey="score"
      fields={[
  {
    "name": "claim",
    "label": "Claim Details (JSON)",
    "type": "json"
  }
]}
    />
  )
}
