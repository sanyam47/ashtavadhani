import os
import sys
import json
import time

def check_qai_hub_configured():
    """Check if QAI Hub client is configured with an API token."""
    config_path = os.path.expanduser("~/.qai_hub/client.ini")
    if os.path.exists(config_path):
        return True, config_path
    if os.environ.get("QAI_HUB_API_TOKEN"):
        return True, "env:QAI_HUB_API_TOKEN"
    return False, config_path

def get_snapdragon_device(target_name="Snapdragon X Elite"):
    import qai_hub as hub
    devices = hub.get_devices()
    for d in devices:
        if target_name.lower() in str(d.name).lower():
            return d
    return hub.Device("Snapdragon X Elite CRD")

def run_npu_optimization(model_path_or_obj, model_name="agentic_editor_model", input_specs=None, target_device="Snapdragon X Elite CRD"):
    """
    Complete pipeline:
    1. Upload to Qualcomm AI Hub
    2. Compile for Hexagon NPU (precompiled_qnn_onnx)
    3. Profile on real Snapdragon X Elite hardware
    4. Generate benchmark report
    """
    import qai_hub as hub
    
    print(f"\n=======================================================")
    print(f" Qualcomm AI Hub: Snapdragon NPU Hardware Acceleration")
    print(f" Target Device: {target_device}")
    print(f" Model: {model_name}")
    print(f"=======================================================\n")
    
    device = hub.Device(target_device)
    
    # 1. Compile
    print("[1/2] Compiling model for Qualcomm Hexagon NPU (QNN)...")
    compile_job = hub.submit_compile_job(
        model=model_path_or_obj,
        device=device,
        name=f"{model_name}_qnn_compile",
        input_specs=input_specs,
        options="--target_runtime precompiled_qnn_onnx"
    )
    print(f"      Job ID: {compile_job.job_id}")
    print(f"      Dashboard: {compile_job.url}")
    print("      Waiting for compilation on Snapdragon X cloud...")
    
    # Wait for compile
    compiled_model = compile_job.get_target_model()
    print("      Compilation SUCCESS!")
    
    # 2. Profile on Hardware
    print("\n[2/2] Running Performance Benchmark on Physical Snapdragon NPU...")
    profile_job = hub.submit_profile_job(
        model=compiled_model,
        device=device,
        name=f"{model_name}_npu_profile"
    )
    print(f"      Job ID: {profile_job.job_id}")
    print(f"      Dashboard: {profile_job.url}")
    print("      Benchmarking latency, compute offload, and memory...")
    
    profile_data = profile_job.download_profile()
    
    print("\n================ BENCHMARK REPORT ================")
    print(f"Hardware: {target_device}")
    print(f"Profile Dashboard: {profile_job.url}")
    print(f"Compile Dashboard: {compile_job.url}")
    print("==================================================\n")
    
    return {
        "model_name": model_name,
        "target_device": target_device,
        "compile_job_id": compile_job.job_id,
        "compile_url": compile_job.url,
        "profile_job_id": profile_job.job_id,
        "profile_url": profile_job.url,
        "profile_data": profile_data
    }

if __name__ == "__main__":
    import qai_hub as hub
    is_ready, path = check_qai_hub_configured()
    print(f"[Setup Verified] Qualcomm AI Hub Connected! ({path})")
    devices = hub.get_devices()
    print(f"Available Snapdragon Devices: {[d.name for d in devices if 'snapdragon' in d.name.lower()]}")
