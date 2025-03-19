#!/usr/bin/env python3

import random
from datetime import datetime, date
from faker import Faker
from neo4j import GraphDatabase

NEO4J_URI = "bolt://localhost:7687"
fake = Faker()

def generate_fake_person_data(num_people=10):
    people = []
    for _ in range(num_people):
        p_id = fake.uuid4()
        now = datetime.now().isoformat()
        people.append({
            "personId": p_id,
            "fullName": fake.name(),
            "primaryTitle": random.choice(["Managing Director", "Partner", "Associate", "Principal"]),
            "sourceOfData": random.choice(["internal_db", "external_provider", "manual_entry"]),
            "createdAt": now,
            "updatedAt": now
        })
    return people

def generate_fake_org_data(num_orgs=5):
    org_types = ["PE Firm", "VC Firm", "Investment Bank", "Asset Manager"]
    orgs = []
    for _ in range(num_orgs):
        org_id = fake.uuid4()
        orgs.append({
            "orgId": org_id,
            "name": fake.company(),
            "type": random.choice(org_types),
            "location": fake.city(),
            "foundedYear": random.randint(1970, 2023)
        })
    return orgs

def generate_fake_deal_data(num_deals=5):
    sectors = ["Technology", "Healthcare", "Finance", "Consumer", "Energy", "Industrial"]
    deals = []
    for _ in range(num_deals):
        d_id = fake.uuid4()
        # Store date as ISO (YYYY-MM-DD)
        deal_date = fake.date_between(start_date="-10y", end_date="today").isoformat()
        deals.append({
            "dealId": d_id,
            "name": f"{fake.company()} Acquisition",
            "dealDate": deal_date,
            "sector": random.choice(sectors),
            "dealSize": round(random.uniform(10.0, 2000.0), 2)
        })
    return deals

def generate_fake_school_data(num_schools=3):
    school_types = ["Business School", "University", "College"]
    schools = []
    for _ in range(num_schools):
        s_id = fake.uuid4()
        schools.append({
            "schoolId": s_id,
            "name": fake.company() + " University",
            "type": random.choice(school_types),
            "location": fake.city()
        })
    return schools

def generate_fake_deal_metrics(deal_id):
    entry_date = fake.date_between(start_date="-5y", end_date="-2y")
    exit_date = fake.date_between(start_date=entry_date, end_date="today")
    irr = round(random.uniform(-0.2, 0.5), 2)
    moic = round(random.uniform(0.5, 5.0), 2)
    multiple = round(random.uniform(0.5, 5.0), 2)
    notes = random.choice(["Strong performance", "Moderate performance", "Underperformed"])

    return {
        "dealId": deal_id,
        "entryDate": entry_date.isoformat(),
        "exitDate": exit_date.isoformat(),
        "IRR": irr,
        "MOIC": moic,
        "multiple": multiple,
        "notes": notes
    }

class Neo4jInserter:
    def __init__(self, uri):
        # Connect with auth disabled (auth=None)
        self.driver = GraphDatabase.driver(uri, auth=None)

    def close(self):
        self.driver.close()

    def create_constraints(self):
        with self.driver.session() as session:
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (p:Person) REQUIRE p.personId IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (o:Organization) REQUIRE o.orgId IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (d:Deal) REQUIRE d.dealId IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (s:School) REQUIRE s.schoolId IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (dm:DealMetrics) REQUIRE dm.dealId IS UNIQUE")

    def insert_person(self, person):
        with self.driver.session() as session:
            session.run("""
                MERGE (p:Person { personId: $personId })
                ON CREATE SET
                  p.fullName = $fullName,
                  p.primaryTitle = $primaryTitle,
                  p.sourceOfData = $sourceOfData,
                  p.createdAt = $createdAt,
                  p.updatedAt = $updatedAt
                ON MATCH SET
                  p.fullName = $fullName,
                  p.primaryTitle = $primaryTitle,
                  p.sourceOfData = $sourceOfData,
                  p.updatedAt = $updatedAt
                """,
                **person
            )

    def insert_organization(self, org):
        with self.driver.session() as session:
            session.run("""
                MERGE (o:Organization { orgId: $orgId })
                ON CREATE SET
                  o.name = $name,
                  o.type = $type,
                  o.location = $location,
                  o.foundedYear = $foundedYear
                ON MATCH SET
                  o.name = $name,
                  o.type = $type,
                  o.location = $location,
                  o.foundedYear = $foundedYear
                """,
                **org
            )

    def insert_deal(self, deal):
        with self.driver.session() as session:
            session.run("""
                MERGE (d:Deal { dealId: $dealId })
                ON CREATE SET
                  d.name = $name,
                  d.dealDate = $dealDate,
                  d.sector = $sector,
                  d.dealSize = $dealSize
                ON MATCH SET
                  d.name = $name,
                  d.dealDate = $dealDate,
                  d.sector = $sector,
                  d.dealSize = $dealSize
                """,
                **deal
            )

    def insert_school(self, school):
        with self.driver.session() as session:
            session.run("""
                MERGE (s:School { schoolId: $schoolId })
                ON CREATE SET
                  s.name = $name,
                  s.type = $type,
                  s.location = $location
                ON MATCH SET
                  s.name = $name,
                  s.type = $type,
                  s.location = $location
                """,
                **school
            )

    def insert_deal_metrics(self, metrics):
        with self.driver.session() as session:
            session.run("""
                MERGE (dm:DealMetrics { dealId: $dealId })
                ON CREATE SET
                  dm.entryDate = $entryDate,
                  dm.exitDate = $exitDate,
                  dm.IRR = $IRR,
                  dm.MOIC = $MOIC,
                  dm.multiple = $multiple,
                  dm.notes = $notes
                ON MATCH SET
                  dm.entryDate = $entryDate,
                  dm.exitDate = $exitDate,
                  dm.IRR = $IRR,
                  dm.MOIC = $MOIC,
                  dm.multiple = $multiple,
                  dm.notes = $notes
                """,
                **metrics
            )
            with self.driver.session() as rel_session:
                rel_session.run("""
                    MATCH (dm:DealMetrics { dealId: $dealId })
                    MATCH (d:Deal { dealId: $dealId })
                    MERGE (d)-[:HAS_METRICS]->(dm)
                    """,
                    dealId=metrics["dealId"]
                )

    def create_works_at_relationship(self, personId, orgId, startDate, role, endDate=None):
        with self.driver.session() as session:
            params = {
                "personId": personId,
                "orgId": orgId,
                "role": role,
                "startDate": startDate,
            }
            cypher = """
            MATCH (p:Person { personId: $personId })
            MATCH (o:Organization { orgId: $orgId })
            MERGE (p)-[r:WORKS_AT { role: $role, startDate: $startDate }]->(o)
            """
            if endDate is not None:
                params["endDate"] = endDate
                cypher += """
                ON CREATE SET r.endDate = $endDate
                ON MATCH SET r.endDate = $endDate
                """
            session.run(cypher, **params)

    def create_involved_in_relationship(self, personId, dealId, role, startDate, endDate=None):
        with self.driver.session() as session:
            params = {
                "personId": personId,
                "dealId": dealId,
                "role": role,
                "startDate": startDate,
            }
            cypher = """
            MATCH (p:Person { personId: $personId })
            MATCH (d:Deal { dealId: $dealId })
            MERGE (p)-[r:INVOLVED_IN { role: $role, startDate: $startDate }]->(d)
            """
            if endDate is not None:
                params["endDate"] = endDate
                cypher += """
                ON CREATE SET r.endDate = $endDate
                ON MATCH SET r.endDate = $endDate
                """
            session.run(cypher, **params)

    def create_invested_in_relationship(self, orgId, dealId, amount, ownershipShare, date):
        with self.driver.session() as session:
            session.run("""
                MATCH (o:Organization { orgId: $orgId })
                MATCH (d:Deal { dealId: $dealId })
                MERGE (o)-[r:INVESTED_IN { amount: $amount, ownershipShare: $ownershipShare, date: $date }]->(d)
                """,
                orgId=orgId,
                dealId=dealId,
                amount=amount,
                ownershipShare=ownershipShare,
                date=date
            )

    def create_educated_at_relationship(self, personId, schoolId, degree, startDate, endDate=None):
        with self.driver.session() as session:
            session.run("""
                MATCH (p:Person { personId: $personId })
                MATCH (s:School { schoolId: $schoolId })
                MERGE (p)-[r:EDUCATED_AT { degree: $degree, startDate: $startDate, endDate: $endDate }]->(s)
                """,
                personId=personId,
                schoolId=schoolId,
                degree=degree,
                startDate=startDate,
                endDate=endDate
            )

    def create_co_invested_with_relationship(self, personIdA, personIdB, dealId, date):
        with self.driver.session() as session:
            session.run("""
                MATCH (pA:Person { personId: $personIdA })
                MATCH (pB:Person { personId: $personIdB })
                MERGE (pA)-[r:CO_INVESTED_WITH { dealId: $dealId, date: $date }]->(pB)
                """,
                personIdA=personIdA,
                personIdB=personIdB,
                dealId=dealId,
                date=date
            )

def connect_data(inserter, people, orgs, deals, schools):
    # (1) Person -> Organization
    for p in people:
        chosen_org = random.choice(orgs)
        start_date_obj = fake.date_between(start_date="-10y", end_date="today")
        start_date_str = start_date_obj.isoformat()
        role = random.choice(["Analyst", "Associate", "Principal", "Director", "Partner"])
        if random.random() < 0.5:
            end_date_obj = fake.date_between(start_date=start_date_obj, end_date="today")
            end_date_str = end_date_obj.isoformat()
        else:
            end_date_str = None
        inserter.create_works_at_relationship(
            p["personId"], chosen_org["orgId"], start_date_str, role, end_date_str
        )
        # 20% chance for a second organization
        if random.random() < 0.2:
            second_org = random.choice(orgs)
            if second_org["orgId"] != chosen_org["orgId"]:
                start_date_obj_2 = fake.date_between(start_date="-8y", end_date="today")
                start_date_str_2 = start_date_obj_2.isoformat()
                role2 = random.choice(["Analyst", "Associate", "Principal", "Director", "Partner"])
                if random.random() < 0.5:
                    end_date_obj_2 = fake.date_between(start_date=start_date_obj_2, end_date="today")
                    end_date_str_2 = end_date_obj_2.isoformat()
                else:
                    end_date_str_2 = None
                inserter.create_works_at_relationship(
                    p["personId"], second_org["orgId"], start_date_str_2, role2, end_date_str_2
                )

    # (2) Person -> Deal
    for p in people:
        chosen_deal = random.choice(deals)
        deal_date_obj = datetime.strptime(chosen_deal["dealDate"], "%Y-%m-%d").date()
        role = random.choice(["Lead", "Co-Lead", "Board Member"])
        inserter.create_involved_in_relationship(
            p["personId"],
            chosen_deal["dealId"],
            role,
            deal_date_obj.isoformat(),
            None
        )
        # 20% chance for a second deal
        if random.random() < 0.2:
            second_deal = random.choice(deals)
            deal_date_obj_2 = datetime.strptime(second_deal["dealDate"], "%Y-%m-%d").date()
            role2 = random.choice(["Lead", "Co-Lead", "Board Member"])
            inserter.create_involved_in_relationship(
                p["personId"],
                second_deal["dealId"],
                role2,
                deal_date_obj_2.isoformat(),
                None
            )

    # (3) Organization -> Deal (Investments)
    for d in deals:
        chosen_org = random.choice(orgs)
        deal_date_obj = datetime.strptime(d["dealDate"], "%Y-%m-%d").date()
        amount = round(random.uniform(1.0, 1000.0), 2)
        ownership_share = round(random.uniform(0.01, 0.5), 2)
        inserter.create_invested_in_relationship(
            chosen_org["orgId"],
            d["dealId"],
            amount,
            ownership_share,
            deal_date_obj.isoformat()
        )
        # 30% chance for a second investor
        if random.random() < 0.3:
            second_org = random.choice(orgs)
            if second_org["orgId"] != chosen_org["orgId"]:
                amount2 = round(random.uniform(1.0, 1000.0), 2)
                ownership_share2 = round(random.uniform(0.01, 0.5), 2)
                inserter.create_invested_in_relationship(
                    second_org["orgId"],
                    d["dealId"],
                    amount2,
                    ownership_share2,
                    deal_date_obj.isoformat()
                )

    # (4) Person -> School
    for p in people:
        if random.random() < 0.5 and schools:
            s = random.choice(schools)
            degree = random.choice(["MBA", "BSc", "BA", "PhD"])
            start_date_obj = fake.date_between(start_date="-20y", end_date="-10y")
            end_date_obj = fake.date_between(start_date=start_date_obj, end_date="-5y")
            inserter.create_educated_at_relationship(
                p["personId"],
                s["schoolId"],
                degree,
                start_date_obj.isoformat(),
                end_date_obj.isoformat()
            )

    # (5) CO_INVESTED_WITH: For each deal, get all involved persons and create some pairwise edges
    with inserter.driver.session() as session:
        result = session.run("""
            MATCH (p:Person)-[r:INVOLVED_IN]->(d:Deal)
            RETURN d.dealId as dealId, collect(p.personId) as personIds
        """)
        for record in result:
            deal_id = record["dealId"]
            person_ids = record["personIds"]
            if len(person_ids) > 1:
                date_str = fake.date_between(start_date="-5y", end_date="today").isoformat()
                for i in range(len(person_ids)):
                    for j in range(i + 1, len(person_ids)):
                        if random.random() < 0.3:
                            inserter.create_co_invested_with_relationship(
                                person_ids[i],
                                person_ids[j],
                                deal_id,
                                date_str
                            )

def main():
    inserter = Neo4jInserter(NEO4J_URI)
    inserter.create_constraints()

    people = generate_fake_person_data(10)
    orgs = generate_fake_org_data(5)
    deals = generate_fake_deal_data(5)
    schools = generate_fake_school_data(3)

    for p in people:
        inserter.insert_person(p)
    for o in orgs:
        inserter.insert_organization(o)
    for d in deals:
        inserter.insert_deal(d)
        if random.random() < 0.7:
            dm = generate_fake_deal_metrics(d["dealId"])
            inserter.insert_deal_metrics(dm)
    for s in schools:
        inserter.insert_school(s)

    connect_data(inserter, people, orgs, deals, schools)

    inserter.close()
    print("Fake data insertion complete!")

if __name__ == "__main__":
    main()
