from neo4j import GraphDatabase

def get_full_graph(driver):
    """
    Query Neo4j for all nodes and relationships, returning a JSON-friendly structure.
    """
    with driver.session() as session:
        # Fetch all nodes
        query_nodes = """
        MATCH (n)
        RETURN ID(n) as id, labels(n) as labels, properties(n) as props
        """
        nodes_result = session.run(query_nodes)
        nodes = []
        for record in nodes_result:
            node_id = record["id"]
            labels = record["labels"]
            props = record["props"]
            nodes.append({
                "id": node_id,
                "labels": labels,
                "properties": props
            })

        # Fetch all relationships
        query_rels = """
        MATCH (n)-[r]->(m)
        RETURN ID(r) as id, TYPE(r) as type, ID(n) as startNode, ID(m) as endNode, properties(r) as props
        """
        rels_result = session.run(query_rels)
        relationships = []
        for record in rels_result:
            rel_id = record["id"]
            rel_type = record["type"]
            start_node = record["startNode"]
            end_node = record["endNode"]
            rel_props = record["props"]
            relationships.append({
                "id": rel_id,
                "type": rel_type,
                "startNode": start_node,
                "endNode": end_node,
                "properties": rel_props
            })

        return {
            "nodes": nodes,
            "relationships": relationships
        }
