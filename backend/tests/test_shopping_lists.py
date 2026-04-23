# backend/tests/test_shopping_lists.py


async def test_generate_shopping_list(auth_client):
    recipe = (await auth_client.post("/recipes", json={
        "name": "Pasta",
        "calories": 500,
        "servings": 1,
        "ingredients": [
            {"name": "Pasta", "quantity": 200, "unit": "g"},
            {"name": "Tomato Sauce", "quantity": 100, "unit": "ml"},
        ],
    })).json()
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 0, "meal_type": "dinner", "recipe_id": recipe["id"], "servings": 1,
    })
    response = await auth_client.post(f"/meal-plans/{plan['id']}/shopping-list")
    assert response.status_code == 201
    items = response.json()["items"]
    names = [i["ingredient_name"] for i in items]
    assert "Pasta" in names


async def test_check_item(auth_client):
    recipe = (await auth_client.post("/recipes", json={
        "name": "Eggs", "calories": 200, "servings": 1,
        "ingredients": [{"name": "Eggs", "quantity": 2, "unit": "pcs"}],
    })).json()
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 0, "meal_type": "breakfast", "recipe_id": recipe["id"], "servings": 1,
    })
    sl = (await auth_client.post(f"/meal-plans/{plan['id']}/shopping-list")).json()
    item_id = sl["items"][0]["id"]
    response = await auth_client.patch(f"/shopping-lists/{sl['id']}/items/{item_id}", json={"is_checked": True})
    assert response.status_code == 200
    assert response.json()["is_checked"] is True


async def test_add_manual_item(auth_client):
    recipe = (await auth_client.post("/recipes", json={"name": "X", "calories": 100, "servings": 1, "ingredients": [{"name": "X"}]})).json()
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={"day_of_week": 0, "meal_type": "lunch", "recipe_id": recipe["id"], "servings": 1})
    sl = (await auth_client.post(f"/meal-plans/{plan['id']}/shopping-list")).json()
    response = await auth_client.post(f"/shopping-lists/{sl['id']}/items", json={
        "ingredient_name": "Olive Oil", "quantity": 1, "unit": "bottle", "category": "other",
    })
    assert response.status_code == 201
    assert response.json()["ingredient_name"] == "Olive Oil"


async def test_get_shopping_list_by_id(auth_client):
    recipe = (await auth_client.post("/recipes", json={
        "name": "Rice", "calories": 300, "servings": 1,
        "ingredients": [{"name": "Rice", "quantity": 150, "unit": "g"}],
    })).json()
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 0, "meal_type": "lunch", "recipe_id": recipe["id"], "servings": 1,
    })
    sl = (await auth_client.post(f"/meal-plans/{plan['id']}/shopping-list")).json()
    response = await auth_client.get(f"/shopping-lists/{sl['id']}")
    assert response.status_code == 200
    assert len(response.json()["items"]) > 0


async def test_delete_shopping_list_item(auth_client):
    recipe = (await auth_client.post("/recipes", json={
        "name": "Soup", "calories": 250, "servings": 1,
        "ingredients": [{"name": "Carrot", "quantity": 100, "unit": "g"}],
    })).json()
    plan = (await auth_client.post("/meal-plans", json={"week_start_date": "2026-04-21", "name": "W1"})).json()
    await auth_client.post(f"/meal-plans/{plan['id']}/entries", json={
        "day_of_week": 0, "meal_type": "dinner", "recipe_id": recipe["id"], "servings": 1,
    })
    sl = (await auth_client.post(f"/meal-plans/{plan['id']}/shopping-list")).json()
    item_id = sl["items"][0]["id"]
    response = await auth_client.delete(f"/shopping-lists/{sl['id']}/items/{item_id}")
    assert response.status_code == 204
