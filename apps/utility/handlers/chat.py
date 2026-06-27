from pydantic_ai.providers.groq import GroqProvider
import os
from pydantic_ai import Agent
from pydantic_ai.models.groq import GroqModel


def build_agent(model_name: str, system_instruction: str) -> Agent:
    """
    Build a pydantic-ai Agent for Groq LLM calls.
    Called once per request; model objects are cheap to construct.
    """
    groq_model = GroqModel(
        model_name,
        provider=GroqProvider(
            api_key=os.environ.get("GROQ_API_KEY"),
        ),
    )
    return Agent(
        model=groq_model,
        system_prompt=system_instruction,
    )


async def handle_chat(
    system_instruction: str, user_message: str, model_name: str
) -> str:
    """
    Call Groq LLM with the given system prompt and user message.
    Returns the LLM output text.
    """
    agent = build_agent(model_name, system_instruction)
    result = await agent.run(user_message)
    return result.output
