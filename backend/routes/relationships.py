from fastapi import APIRouter
from neo4j import GraphDatabase
import os

from utils.graph_utils import get_full_graph

router = APIRouter(prefix="/relationships", tags=["Relationships"])

# Minimal Neo4j driver setup.
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "")

driver = GraphDatabase.driver(NEO4J_URI, auth=None)

@router.get("/people")
def get_people_from_neo4j(limit: int = 10):
    """
    Query Neo4j for Person nodes.
    Returns a list of basic person data: personId, fullName, primaryTitle.
    """
    with driver.session() as session:
        query = """
        MATCH (p:Person)
        RETURN p.personId AS personId, p.fullName AS fullName, p.primaryTitle AS primaryTitle
        LIMIT $limit
        """
        records = session.run(query, limit=limit)
        results = []
        for r in records:
            results.append({
                "personId": r["personId"],
                "fullName": r["fullName"],
                "primaryTitle": r["primaryTitle"],
            })
        return {"people": results}

@router.get("/graph")
def get_full_graph_data():
    """
    Return the entire graph (all nodes and relationships)
    in a JSON structure that the frontend can use to visualize.
    """
    return get_full_graph(driver)
