from fastapi import APIRouter, Body
from neo4j import GraphDatabase
import os

from utils.graph_utils import get_full_graph
from utils.cypher_queries import run_named_query

router = APIRouter(prefix="/relationships", tags=["Relationships"])

# Minimal Neo4j driver setup.
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "")

driver = GraphDatabase.driver(NEO4J_URI, auth=None)

def init_gds_graph():
    """
    Drop (if exists) and create the 'myGraph' in GDS so that
    queries like degree_centrality, pageRank, etc. can run
    without error. Called once when this router is initialized.
    """
    drop_query = "CALL gds.graph.drop('myGraph', false)"
    project_query = """
    CALL gds.graph.project(
      'myGraph',
      ['Person','Organization','Deal','School','DealMetrics'],
      {
        WORKS_AT: { type: 'WORKS_AT', orientation: 'UNDIRECTED' },
        INVOLVED_IN: { type: 'INVOLVED_IN', orientation: 'UNDIRECTED' },
        INVESTED_IN: { type: 'INVESTED_IN', orientation: 'UNDIRECTED' },
        EDUCATED_AT: { type: 'EDUCATED_AT', orientation: 'UNDIRECTED' },
        CO_INVESTED_WITH: { type: 'CO_INVESTED_WITH', orientation: 'UNDIRECTED' },
        HAS_METRICS: { type: 'HAS_METRICS', orientation: 'UNDIRECTED' }
      }
    )
    """
    with driver.session() as session:
        try:
            session.run(drop_query)
        except Exception as e:
            # Not necessarily an error if the graph doesn't exist yet
            print("Warning: Could not drop 'myGraph' (may not exist).", e)
        # Attempt to create the graph
        session.run(project_query)

@router.on_event("startup")
def on_startup():
    """
    FastAPI event hook - ensure GDS graph is created when the app starts.
    """
    try:
        init_gds_graph()
        print("GDS Graph 'myGraph' initialized successfully.")
    except Exception as e:
        print("Error initializing GDS Graph 'myGraph':", e)

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

@router.post("/run-query")
def run_query(queryName: str = Body(..., embed=True)):
    """
    Accepts a queryName in the body:
       { "queryName": "degree_centrality" }
    and runs the corresponding query from cypher_queries.py
    returning the raw results (keys, _fields, etc.).
    """
    try:
        results = run_named_query(driver, queryName)
        return results
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": str(e)}
