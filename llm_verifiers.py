from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from PROMPTS import need_or_not_human, need_or_not_system, FINAL_VERIFIER_HUMAN, FINAL_VERIFIER_SYSTEM
from pydantic import BaseModel, Field
from typing import Literal
from dotenv import load_dotenv

load_dotenv()

model = ChatGroq(model = "openai/gtp-oss-120b")

class NeedOrNot(BaseModel):
    need_or_not : Literal["yes", "no"] = Field(..., description="Whether the extension should activate or not")
need_or_not_model = model.with_structured_output(NeedOrNot)

class FinalReview(BaseModel):
    incorrect_fields : dict[str, str] = Field(description="A dictionary of fields that were incorrectly classified, with the field name as the key and the reason for misclassification as the value", default=None)
final_review_model = model.with_structured_output(FinalReview)



async def need_or_not_provider(page_snapshot : str):
    system_message = SystemMessage(content=need_or_not_system)
    human_message = HumanMessage(content=need_or_not_human.format(page_snapshot))
    responce = await need_or_not_model.ainvoke([system_message, human_message]).need_or_not
    responce = responce.lower().strip()
    return {"need_or_not": responce}

async def final_review_provider(original_data : dict, provided_data : dict):
    system_message = SystemMessage(content=FINAL_VERIFIER_SYSTEM)
    human_message = HumanMessage(content=FINAL_VERIFIER_HUMAN.format(original_data, provided_data))
    responce = await final_review_model.ainvoke([system_message, human_message]).incorrect_fields
    if responce is None:
        return {"incorrect_fields": {}}
    return {"incorrect_fields": responce}
