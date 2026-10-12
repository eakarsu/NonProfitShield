import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const email = String(process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (!email || password.length < 12) throw new Error('Configured demo actor credentials are required');

const stableUuid = (value) => {
  const bytes = Buffer.from(crypto.createHash('sha256').update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.keys(value).sort().reduce((out, key) => { out[key] = canonical(value[key]); return out; }, {})
    : value;
const digest = (value) => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const runtimePasswordMatches = (encoded, candidate) => {
  const [scheme, salt, expectedHex] = String(encoded || '').split('$');
  if (scheme !== 'scrypt' || !salt || !/^[0-9a-f]{64}$/i.test(expectedHex || '')) return false;
  const actual = crypto.scryptSync(candidate, salt, 32);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
let insertedPolicies = 0;
let insertedClaims = 0;
let insertedPaymentPlans = 0;
let insertedPrograms = 0;
let insertedRuntimeReports = 0;
let createdActor = false;
try {
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('NonProfitShield configured demo fixtures'))");
  const required = ['users', 'policies', 'nonprofit_organizations', 'nonprofit_memberships', 'nonprofit_records', 'nonprofit_record_history', 'nonprofit_audit', 'runtime_app_users', 'runtime_ai_interactions'];
  const existingTables = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename=ANY($1::text[])", [required])).rows.map((row) => row.tablename);
  const missing = required.filter((name) => !existingTables.includes(name));
  if (missing.length) throw new Error(`Required migrations are missing: ${missing.join(', ')}`);

  let actor = (await client.query('SELECT id,password,role,email_verified FROM users WHERE lower(email)=$1 FOR UPDATE', [email])).rows[0];
  if (actor) {
    if (!actor.password || !(await bcrypt.compare(password, actor.password))) {
      throw new Error('Configured actor exists but its credentials do not match; refusing to overwrite the account');
    }
  } else {
    const id = stableUuid(`NonProfitShield:${email}`);
    const passwordHash = await bcrypt.hash(password, 12);
    actor = (await client.query(
      `INSERT INTO users(id,email,first_name,last_name,password,role,email_verified,created_at,updated_at)
       VALUES($1,$2,'Demo','Administrator',$3,'admin',TRUE,NOW(),NOW()) RETURNING id,password,role,email_verified`,
      [id, email, passwordHash],
    )).rows[0];
    createdActor = true;
  }

  const policyCount = Number((await client.query('SELECT count(*) AS count FROM policies WHERE user_id=$1', [actor.id])).rows[0].count);
  if (policyCount === 0) {
    for (let index = 1; index <= 15; index += 1) {
      const fixtureKey = `nonprofitshield-training-policy-${String(index).padStart(2, '0')}`;
      await client.query(
        `INSERT INTO policies(user_id,type,status,coverage_amount,monthly_premium,deductible,start_date,property_info)
         VALUES($1,'home','training_draft',0,0,0,$2,$3::jsonb)`,
        [actor.id, new Date(Date.UTC(2026, 0, index)), JSON.stringify({
          fixtureKey,
          training: true,
          fictional: true,
          address: `Fictional Training Site ${String(index).padStart(2, '0')} — not an insured location`,
          yearBuilt: 2000 + (index % 20),
          squareFootage: 1000 + index * 25,
          propertyType: 'single_family',
          constructionType: 'frame',
          roofType: 'shingle',
          hasSecuritySystem: false,
          hasFireAlarm: false,
          source: 'NonProfitShield configured demo fixture v1',
        })],
      );
      insertedPolicies += 1;
    }
  }

  const trainingPolicies = (await client.query(
    `SELECT id FROM policies
     WHERE user_id=$1 AND status='training_draft'
       AND property_info->>'fixtureKey' LIKE 'nonprofitshield-training-policy-%'
     ORDER BY property_info->>'fixtureKey', id
     LIMIT 15`,
    [actor.id],
  )).rows;
  if (trainingPolicies.length < 15) {
    throw new Error(`Expected 15 actor-owned fictional training policies; found ${trainingPolicies.length}. Refusing to attach draft claim/payment records to unknown policies`);
  }
  for (let index = 1; index <= 15; index += 1) {
    const sequence = String(index).padStart(2, '0');
    const title = `Fictional training claim draft ${sequence}`;
    let claim = (await client.query(
      `SELECT id,status,images,ai_assessment,approved_amount,paid_amount,submitted_at
       FROM claims WHERE user_id=$1 AND title=$2 FOR UPDATE`,
      [actor.id, title],
    )).rows[0];
    if (!claim) {
      claim = (await client.query(
        `INSERT INTO claims(
           user_id,policy_id,title,description,status,estimated_amount,approved_amount,paid_amount,
           images,ai_assessment,incident_date,submitted_at,processed_at,paid_at
         ) VALUES(
           $1,$2,$3,$4,'training_draft_unsubmitted',NULL,NULL,NULL,
           '[]'::jsonb,NULL,$5,NULL,NULL,NULL
         ) RETURNING id,status,images,ai_assessment,approved_amount,paid_amount,submitted_at`,
        [
          actor.id,
          trainingPolicies[index - 1].id,
          title,
          'Fictional training/planning draft only. No incident, loss, damage, images, evidence, coverage decision, approval, submission, processing, payment, or provider action is represented.',
          new Date(Date.UTC(2026, 0, index)),
        ],
      )).rows[0];
      insertedClaims += 1;
    }
    const unsafeClaim = claim.status !== 'training_draft_unsubmitted'
      || (Array.isArray(claim.images) && claim.images.length > 0)
      || claim.ai_assessment != null
      || claim.approved_amount != null
      || claim.paid_amount != null
      || claim.submitted_at != null;
    if (unsafeClaim) throw new Error(`Training claim draft ${sequence} contains submission, evidence, assessment, approval, or payment state; refusing to alter it`);

    const existingPlan = (await client.query(
      `SELECT id FROM payments
       WHERE user_id=$1 AND claim_id=$2 AND type='training_payment_plan'
         AND status='planning_draft_unpaid' FOR UPDATE`,
      [actor.id, claim.id],
    )).rows[0];
    if (!existingPlan) {
      await client.query(
        `INSERT INTO payments(
           user_id,policy_id,claim_id,type,amount,currency,payment_method,
           bitcoin_address,bitcoin_tx_id,bitcoin_amount,status,confirmed_at
         ) VALUES(
           $1,$2,$3,'training_payment_plan',0,'USD','not_selected',
           NULL,NULL,NULL,'planning_draft_unpaid',NULL
         )`,
        [actor.id, trainingPolicies[index - 1].id, claim.id],
      );
      insertedPaymentPlans += 1;
    }
  }

  const organizationId = stableUuid(`NonProfitShield:training-org:${email}`);
  await client.query(
    `INSERT INTO nonprofit_organizations(id,name,status,default_retention_days)
     VALUES($1,'NonProfitShield Fictional Training Workspace','active',365)
     ON CONFLICT(id) DO NOTHING`,
    [organizationId],
  );
  await client.query(
    `INSERT INTO nonprofit_memberships(organization_id,user_id,role,status)
     VALUES($1,$2,'program_manager','active')
     ON CONFLICT(organization_id,user_id) DO NOTHING`,
    [organizationId, actor.id],
  );
  const programCount = Number((await client.query(
    "SELECT count(*) AS count FROM nonprofit_records WHERE organization_id=$1 AND kind='program' AND owner_id=$2",
    [organizationId, actor.id],
  )).rows[0].count);
  if (programCount === 0) {
    for (let index = 1; index <= 15; index += 1) {
      const id = stableUuid(`NonProfitShield:training-program:${email}:${index}`);
      const data = {
        externalRef: `TRAINING-PROGRAM-${String(index).padStart(2, '0')}`,
        name: `Fictional Training Program ${String(index).padStart(2, '0')}`,
        ownerId: actor.id,
        startDate: `2026-${String(((index - 1) % 12) + 1).padStart(2, '0')}-01`,
        sourceVersion: 'fictional-training-v1',
        training: true,
        fictional: true,
        note: 'Draft training record only; no participants, consent, funding, approval, eligibility or delivery is represented.',
      };
      const dataHash = digest(data);
      await client.query(
        `INSERT INTO nonprofit_records(id,organization_id,kind,external_ref,state,owner_id,data,data_hash,expires_at)
         VALUES($1,$2,'program',$3,'draft',$4,$5::jsonb,$6,NOW()+INTERVAL '365 days')`,
        [id, organizationId, data.externalRef, actor.id, JSON.stringify(data), dataHash],
      );
      await client.query(
        `INSERT INTO nonprofit_record_history(organization_id,record_id,to_state,actor_id,evidence_hash)
         VALUES($1,$2,'draft',$3,$4)`,
        [organizationId, id, actor.id, dataHash],
      );
      await client.query(
        `INSERT INTO nonprofit_audit(organization_id,actor_id,actor_role,action,resource_type,resource_id,after_hash,metadata)
         VALUES($1,$2,'program_manager','record.training_fixture_created','program',$3,$4,$5::jsonb)`,
        [organizationId, actor.id, id, dataHash, JSON.stringify({ training: true, fictional: true, sourceVersion: 'fictional-training-v1' })],
      );
      insertedPrograms += 1;
    }
  }

  const runtimeActor = (await client.query(
    'SELECT id,password_hash,role,active FROM runtime_app_users WHERE lower(email)=$1 FOR UPDATE',
    [email],
  )).rows[0];
  if (!runtimeActor || !runtimeActor.active || !runtimePasswordMatches(runtimeActor.password_hash, password)) {
    throw new Error('Configured runtime actor is missing, inactive, or its credentials do not match; refusing to provision report drafts');
  }
  for (let index = 1; index <= 15; index += 1) {
    const sequence = String(index).padStart(2, '0');
    const fixtureKey = `nonprofitshield-training-advisory-${sequence}`;
    const exists = (await client.query(
      `SELECT id FROM runtime_ai_interactions
       WHERE user_id=$1 AND feature='nonprofit-guidance' AND input->>'fixtureKey'=$2
       FOR UPDATE`,
      [runtimeActor.id, fixtureKey],
    )).rows[0];
    if (exists) continue;
    const prompt = `Fictional training advisory draft ${sequence}. Review a documentation handoff using only the explicit fixture note; no actual organization, participant, consent, funding, policy, approval, provider action, or source record is supplied.`;
    const content = `## Fictional training advisory ${sequence}\n\nThis is a controlled planning fixture, not OpenRouter output and not evidence of an executed provider action. The only source reference is the built-in NonProfitShield training fixture \`${fixtureKey}\`.\n\n### Evidence boundary\n\nNo actual records, participant data, consent, funding, coverage, approval, payment, delivery, or provider receipt is represented. Authorized human review is required before any real action.`;
    await client.query(
      `INSERT INTO runtime_ai_interactions(user_id,feature,input,output,model,created_at)
       VALUES($1,'nonprofit-guidance',$2::jsonb,$3::jsonb,'controlled/fictional-training-fixture',$4)`,
      [
        runtimeActor.id,
        JSON.stringify({ prompt, fixtureKey, training: true, fictional: true, source: 'NonProfitShield configured demo fixture v1' }),
        JSON.stringify({ content, training: true, fictional: true, providerExecuted: false }),
        new Date(Date.UTC(2026, 1, index, 12)),
      ],
    );
    insertedRuntimeReports += 1;
  }

  const counts = (await client.query(
    `SELECT
       (SELECT count(*)::int FROM policies WHERE user_id=$1) AS policies,
       (SELECT count(*)::int FROM claims WHERE user_id=$1) AS claims,
       (SELECT count(*)::int FROM payments WHERE user_id=$1) AS payments,
       (SELECT count(*)::int FROM nonprofit_records WHERE organization_id=$2 AND owner_id=$1) AS nonprofit_records,
       (SELECT count(*)::int FROM runtime_ai_interactions WHERE user_id=$3 AND feature='nonprofit-guidance') AS runtime_reports,
       (SELECT count(*)::int FROM nonprofit_approvals WHERE organization_id=$2) AS approvals,
       (SELECT count(*)::int FROM nonprofit_integration_jobs WHERE organization_id=$2) AS integration_jobs`,
    [actor.id, organizationId, runtimeActor.id],
  )).rows[0];
  await client.query('COMMIT');
  console.log(JSON.stringify({
    actorId: actor.id,
    runtimeActorId: runtimeActor.id,
    organizationId,
    createdActor,
    insertedPolicies,
    insertedClaims,
    insertedPaymentPlans,
    insertedPrograms,
    insertedRuntimeReports,
    totals: counts,
    approvalsCreated: 0,
    integrationJobsCreated: 0,
    credentialOverwrite: false,
  }));
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
