// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapClaimStatusChatbotPage() {
  return (
    <GapFeaturePage
      title="Claim Status Chatbot"
      description="Claim Status Chatbot"
      slug="claim-status-chatbot"
      aiResultKey="response"
      fields={[
  {
    "name": "claimId",
    "label": "Claim ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "question",
    "label": "Customer Question",
    "type": "textarea",
    "rows": 4,
    "required": true
  }
]}
    />
  )
}
