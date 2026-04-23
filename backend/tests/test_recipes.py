import pytest


async def test_create_recipe(auth_client):
    response = await auth_client.post("/recipes", json={
        "name": "Oatmeal",
        "calories": 350,
        "protein_g": 12,
        "carbs_g": 60,
        "fat_g": 7,
        "servings": 1,
        "ingredients": [{"name": "Oats", "quantity": 100, "unit": "g"}],
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Oatmeal"


async def test_list_recipes_includes_own(auth_client):
    await auth_client.post("/recipes", json={"name": "Salad", "calories": 200})
    response = await auth_client.get("/recipes")
    assert response.status_code == 200
    names = [r["name"] for r in response.json()]
    assert "Salad" in names


async def test_get_recipe(auth_client):
    created = (await auth_client.post("/recipes", json={"name": "Toast", "calories": 150})).json()
    response = await auth_client.get(f"/recipes/{created['id']}")
    assert response.status_code == 200
    assert response.json()["name"] == "Toast"


async def test_update_recipe(auth_client):
    created = (await auth_client.post("/recipes", json={"name": "Old Name", "calories": 100})).json()
    response = await auth_client.put(f"/recipes/{created['id']}", json={"name": "New Name"})
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


async def test_delete_recipe(auth_client):
    created = (await auth_client.post("/recipes", json={"name": "Delete Me", "calories": 100})).json()
    response = await auth_client.delete(f"/recipes/{created['id']}")
    assert response.status_code == 204
    response = await auth_client.get(f"/recipes/{created['id']}")
    assert response.status_code == 404


async def test_search_recipes(auth_client):
    await auth_client.post("/recipes", json={"name": "Chicken Soup", "calories": 400})
    await auth_client.post("/recipes", json={"name": "Beef Stew", "calories": 500})
    response = await auth_client.get("/recipes?search=chicken")
    assert response.status_code == 200
    assert all("chicken" in r["name"].lower() for r in response.json())
