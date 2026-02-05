from cio_app.services.nlp_service import nlp_service

def test_query(query):
    print(f"Query: '{query}'")
    result = nlp_service.parse_query(query)
    print(f"Result: {result}")
    print("-" * 30)

if __name__ == "__main__":
    # User's failing query
    test_query("I have Buyed the KITEX  12 stoke at 211.40 yesterday. Should I hold it or sell it now?")
    
    # Other complex queries
    test_query("Is now a good time to buy RELIANCE?")
    test_query("What do you think about TATASTEEL?")
    test_query("analyze INFY for me")
